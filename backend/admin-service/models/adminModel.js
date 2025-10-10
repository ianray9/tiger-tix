const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.resolve("backend/shared-db/database.sqlite");

const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        return console.error(error.message);
    }
});

// Purpose: Insert a event entry into the events database
//
// Inputs: eventInfo - contains the info of the event to be inserted
//         callback - function to callback once db async funct is finished
// Output: returns callback with error message if failed or null 
// for error and inserted event info if iserted successfuly
const insertEvent = (eventInfo, callback) => {
    const { title, description, start_time, end_time, venue, capacity } = eventInfo;

    db.run(
        `INSERT INTO events (title, description, start_time,
         end_time, venue, capacity, available_tickets)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,

        // Set init available_tickets to capacity
        [title, description, start_time, end_time, venue, capacity, capacity],
        function (error) {
            if (error) {
                console.error(error.message);
                return callback(error);
            }
            console.log(`Inserted a event with ID: ${this.lastID}`);
            return callback(null, {event_id: this.lastID, ...eventInfo});
        }
    );
}

module.exports = { insertEvent };
