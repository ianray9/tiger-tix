const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ✅ Correct shared DB path
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../shared-db/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("LLM DB connection error:", err.message);
  else console.log("LLM connected to SQLite database.");
});

// ✅ Get all events
function getAvailableEvents() {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT 
        id AS eventId,
        title,
        start_time AS startTime,
        (total_tickets - tickets_sold) AS remaining
      FROM events
      ORDER BY id ASC
      `,
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

// ✅ Get event by NAME
function getEventByName(title) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM events WHERE LOWER(title) = LOWER(?)`,
      [title],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

// ✅ Get event by ID
function getEventById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM events WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

// ✅ Book tickets using real schema (transactions)
function bookTickets(eventId, quantity) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // ✅ Read event
      db.get(
        `SELECT total_tickets, tickets_sold FROM events WHERE id = ?`,
        [eventId],
        (err, event) => {
          if (err) return reject(err);
          if (!event) return reject(new Error("EventNotFound"));

          const remaining = event.total_tickets - event.tickets_sold;
          if (remaining < quantity) return reject(new Error("NotEnoughTickets"));

          // ✅ Start transaction
          db.run("BEGIN TRANSACTION");

          // ✅ Update sold count
          db.run(
            `
            UPDATE events
            SET tickets_sold = tickets_sold + ?
            WHERE id = ?
            `,
            [quantity, eventId],
            (err2) => {
              if (err2) {
                db.run("ROLLBACK");
                return reject(err2);
              }

              // ✅ Insert into bookings table
              db.run(
                `INSERT INTO bookings (event_id, quantity) VALUES (?, ?)`,
                [eventId, quantity],
                function (err3) {
                  if (err3) {
                    db.run("ROLLBACK");
                    return reject(err3);
                  }

                  db.run("COMMIT");
                  resolve(this.lastID);
                }
              );
            }
          );
        }
      );
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
