const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../shared-db/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('LLM DB connection error:', err.message);
    else console.log('LLM connected to SQLite database.');
});

// Purpose: Helper function to get all events without realing on client 
// Output: Promise if resolve contains list of events
function getAvailableEvents() {
    return new Promise((resolve, reject) => {
        db.all(
            `
      SELECT
        eventId,
        title,
        startTime,
        availableTickets
      FROM events
      ORDER BY startTime ASC, eventId ASC
      `,
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

// Purpose: Find a event by the title
// Inputs: title - name of event ot find
// Output: Promise if resolve contains event info
function getEventByName(title) {
    return new Promise((resolve, reject) => {
        db.get(
            `
      SELECT
        eventId,
        title,
        startTime,
        description,
        venue,
        capacity,
        availableTickets
      FROM events
      WHERE LOWER(title) = LOWER(?)
      ORDER BY startTime ASC, eventId ASC
      `,
            [title],
            (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            }
        );
    });
}

// Purpose: Find a event by the title
// Inputs: eventId - id of event to find
// Output: Promise if resolve contains event info
function getEventById(eventId) {
    return new Promise((resolve, reject) => {
        db.get(
            `
      SELECT
        eventId,
        title,
        startTime,
        description,
        venue,
        capacity,
        availableTickets
      FROM events
      WHERE eventId = ?
      `,
            [eventId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            }
        );
    });
}

// Purpose: Update an event's info to show one less available ticket from client model
// Inputs: eventId - id of event to book tickets from
//         quantity - the amount of tickets to book
// Output: Promise of succese message if resolved
function bookTickets(eventId, quantity) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            db.get(
                `
        SELECT capacity, availableTickets
        FROM events
        WHERE eventId = ?
        `,
                [eventId],
                (err, event) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return reject(err);
                    }

                    if (!event) {
                        db.run('ROLLBACK');
                        return reject(new Error('EventNotFound'));
                    }

                    if (event.availableTickets < quantity) {
                        db.run('ROLLBACK');
                        return reject(new Error('NotEnoughTickets'));
                    }

                    db.run(
                        `
            UPDATE events
            SET availableTickets = availableTickets - ?
            WHERE eventId = ?
            `,
                        [quantity, eventId],
                        function(updateErr) {
                            if (updateErr) {
                                db.run('ROLLBACK');
                                return reject(updateErr);
                            }

                            db.run('COMMIT', (commitErr) => {
                                if (commitErr) return reject(commitErr);

                                const remaining = event.availableTickets - quantity;
                                resolve({ eventId, remaining });
                            });
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
