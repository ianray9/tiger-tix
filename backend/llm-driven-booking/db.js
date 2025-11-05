const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../shared-db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// Get all events
function getAvailableEvents() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, name, total_tickets, tickets_sold, 
                   (total_tickets - tickets_sold) AS remaining 
            FROM events`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Get event by name
function getEventByName(name) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM events WHERE LOWER(name) = LOWER(?)`, [name], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Get event by id
function getEventById(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM events WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Book tickets safely in a transaction
function bookTickets(eventId, quantity) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(`SELECT total_tickets, tickets_sold FROM events WHERE id = ?`, [eventId], (err, event) => {
        if (err) return reject(err);
        if (!event) return reject(new Error('EventNotFound'));

        const remaining = event.total_tickets - event.tickets_sold;
        if (remaining < quantity) return reject(new Error('NotEnoughTickets'));

        db.run('BEGIN TRANSACTION');
        db.run(`UPDATE events SET tickets_sold = tickets_sold + ? WHERE id = ?`, [quantity, eventId], (err2) => {
          if (err2) {
            db.run('ROLLBACK');
            return reject(err2);
          }

          db.run(`INSERT INTO bookings (event_id, quantity) VALUES (?, ?)`, [eventId, quantity], function (err3) {
            if (err3) {
              db.run('ROLLBACK');
              return reject(err3);
            }
            db.run('COMMIT');
            resolve(this.lastID);
          });
        });
      });
    });
  });
}

module.exports = {
  db,
  getAvailableEvents,
  getEventByName,
  getEventById,
  bookTickets
};
