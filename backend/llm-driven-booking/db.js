const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../shared-db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// Get all events
function getAvailableEvents() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT eventId, title, availableTickets AS remaining 
            FROM events`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Get event by name
function getEventByName(title) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM events WHERE LOWER(title) = LOWER(?)`, [title], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Get event by id
function getEventById(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM events WHERE eventId = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Book tickets safely in a transaction
function bookTickets(eventId, quantity) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(`SELECT availableTickets FROM events WHERE eventId = ?`, [eventId], (err, event) => {
        if (err) return reject(err);
        if (!event) return reject(new Error('EventNotFound'));

        const remaining = event.availableTickets;
        if (remaining < quantity) return reject(new Error('NotEnoughTickets'));

        db.run('BEGIN TRANSACTION');
        db.run(`UPDATE events SET tickets_sold = availableTickets - ? WHERE eventId = ?`, [quantity, eventId], (err2) => {
          if (err2) {
            db.run('ROLLBACK');
            return reject(err2);
          }

          db.run(`INSERT INTO bookings (event_id, quantity) VALUES (?, ?)`, [eventId, quantity], function(err3) {
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
