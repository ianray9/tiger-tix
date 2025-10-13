const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.resolve("backend/shared-db/database.sqlite");

const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        return console.error(error.message);
    }
    else console.log('Connected to shared SQLite database.');
});

// Purpose: Insert a event entry into the events database
//
// Inputs: eventInfo - contains the info of the event to be inserted
//              - title: name of event, description: short description of event
//              - startTime: start time in ISO 8601 format "YYYY-MM-DDTHH:MM:SS"
//              - endTime: end time in ISO 8601 format "YYYY-MM-DDTHH:MM:SS"
//              - venue: name of venue the event will take place in
//              - capacity: max amount of people that can attend event 
//              (availableTickets will be set to capacity initally)
//         callback - function to callback once db async funct is finished
// Output: Returns callback with error message if failed or null 
// for error and inserted event info if iserted successfuly
const insertEvent = (eventInfo, callback) => {
    const { title, description, startTime, endTime, venue, capacity } = eventInfo;

    db.run(
        `INSERT INTO events (title, description, startTime,
         endTime, venue, capacity, availableTickets)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,

        // Set init availableTickets to capacity
        [title, description, startTime, endTime, venue, capacity, capacity],
        function(error) {
            if (error) {
                console.error(error.message);
                return callback(error);
            }
            console.log(`Inserted a event with ID: ${this.lastID}`);
            return callback(null, { eventId: this.lastID, ...eventInfo });
        }
    );
}

// Purpose: Update information of a current event in the database
//
// Inputs: eventId - the ID of the event to be updated
//         eventInfo - contains the info of the event to be inserted
//              - eventId: id of event to be updated
//              - title: name of event, description: short description of event
//              - startTime: start time in ISO 8601 format "YYYY-MM-DDTHH:MM:SS"
//              - endTime: end time in ISO 8601 format "YYYY-MM-DDTHH:MM:SS"
//              - venue: name of venue the event will take place in
//              - capacity: max amount of people that can attend event 
//              - availableTickets: number of tickets left for event
//         callback - function to callback once db async funct is finished
// Output: Returns callback with error message if failed or null 
// for error and updated event info if iserted successfuly
const updateEvent = (eventId, eventInfo, callback) => {
    const { title, description, startTime, endTime, venue, capacity, availableTickets } = eventInfo;

    db.run(
        `UPDATE events SET title = ?, description = ?, startTime = ?,
         endTime = ?, venue = ?, capacity = ?, availableTickets = ?
         WHERE eventId = ?`,
        [title, description, startTime, endTime, venue, capacity, availableTickets, eventId],
        function(error) {
            if (error) {
                console.error(error.message);
                return callback(error);
            }

            if (this.changes === 0) {
                return callback(new Error("Event not found"))
            }
            console.log(`Updated a event with ID: ${this.lastID}`);
            return callback(null, { eventId, ...eventInfo });
        }
    );
}

module.exports = { insertEvent, updateEvent };
