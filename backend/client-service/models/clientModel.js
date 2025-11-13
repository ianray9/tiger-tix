const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

const dbPath =
    process.env.NODE_ENV === 'test'
        ? ':memory:'
        : path.resolve(__dirname, '../../shared-db/database.sqlite');

console.log("CLIENT SERVICE DB PATH:", dbPath);

// Initialize DB unless running tests
if (!process.env.TEST_DB) {
    db = new sqlite3.Database(dbPath, (error) => {
        if (error) {
            console.error('Database connection error:', error.message);
        } else {
            console.log(`Connected to ${process.env.NODE_ENV === 'test' ? 'in-memory' : 'shared'} SQLite database.`);
        }
    });
}

const initDB = (database) => {
    db = database;
};

/**
 * GET ALL EVENTS
 * This returns:
 * - eventId            (mapped from id)
 * - title
 * - startTime
 * - availableTickets   (computed)
 */
const getAllEvents = () => {
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
            (error, rows) => {
                if (error) reject(error);
                else resolve(rows);
            }
        );
    });
};

/**
 * ✅ PURCHASE A TICKET
 * Decreases tickets_sold by 1
 */
const purchaseTicket = (eventId) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN IMMEDIATE TRANSACTION');

            db.get(
                `
                SELECT total_tickets, tickets_sold
                FROM events
                WHERE id = ?
                `,
                [eventId],
                (error, event) => {
                    if (error) {
                        db.run('ROLLBACK');
                        return reject(error);
                    }

                    if (!event) {
                        db.run('ROLLBACK');
                        return reject(new Error('Event not found'));
                    }

                    const remaining = event.total_tickets - event.tickets_sold;
                    if (remaining <= 0) {
                        db.run('ROLLBACK');
                        return reject(new Error('No tickets available'));
                    }

                    db.run(
                        `
                        UPDATE events
                        SET tickets_sold = tickets_sold + 1
                        WHERE id = ?
                        `,
                        [eventId],
                        function(updateError) {
                            if (updateError) {
                                db.run('ROLLBACK');
                                return reject(updateError);
                            }

                            db.run('COMMIT');
                            resolve({ message: 'Ticket purchased successfully' });
                        }
                    );
                }
            );
        });
    });
};

module.exports = { getAllEvents, purchaseTicket, initDB };
