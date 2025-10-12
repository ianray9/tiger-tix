const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve('backend/shared-db/database.sqlite');
console.log(dbPath);
const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        return console.error(error.message);
    }
    else console.log('Connected to shared SQLite database.');
});

// Purpose: Get all events in the shared database
//
// Output: Returns a promise that if resolved will return the rows of 
// events and else the error received from the database
const getAllEvents = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM events', [], (error, rows) => {
            if (error) reject(error);
            else resolve(rows);
        });
    });
}

// Purpose: Update an event's info to show one less available ticket
// Inputs: eventID - the id of the event to decrease available tickets
//
// Output: Returns promise with success message if resolved and the error
// message from the database if rejected
const purchaseTicket = (eventID) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            db.get('SELECT availableTickets FROM events WHERE eventID = ?', [eventID], (error, event) => {
                if (error) {
                    db.run('ROLLBACK');
                    return reject(error);
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
                    'UPDATE events SET availableTickets = availableTickets - 1 WHERE eventID = ?',
                    [eventID],
                    function(error) {
                        if (error) {
                            db.run('ROLLBACK');
                            return reject(error);
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
