const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../shared/eventDB.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB connection error:', err.message);
  else console.log('Connected to shared SQLite database.');
});


function getAllEvents() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM events', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function purchaseTicket(eventId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.get('SELECT availableTickets FROM events WHERE id = ?', [eventId], (err, event) => {
        if (err) {
          db.run('ROLLBACK');
          return reject(err);
        }

        if (!event) {
          db.run('ROLLBACK');
          return reject(new Error('Event not found'));
        }

        if (event.availableTickets <= 0) {
          db.run('ROLLBACK');
          return reject(new Error('No tickets available'));
        }

        db.run(
          'UPDATE events SET availableTickets = availableTickets - 1 WHERE id = ?',
          [eventId],
          function (err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }

            db.run('COMMIT');
            resolve({ message: 'Ticket purchased successfully' });
          }
        );
      });
    });
  });
}

module.exports = { getAllEvents, purchaseTicket };
