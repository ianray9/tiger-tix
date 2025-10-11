const { insertEvent, updateEvent } = require('../models/adminModel.js');

// Purpose: Create a event to insert into the sqllite database
//
// Inputs: req - request containing the info of the event to be inserted
//              - title: name of event, description: short description of event
//              - startTime: start time in ISO 8601 format "YYYY-MM-DDTHH:MM:SS"
//              - endTime: end time in ISO 8601 format "YYYY-MM-DDTHH:MM:SS"
//              - venue: name of venue the event will take place in
//              - capacity: max amount of people that can attend event 
//              (available_tickets will be set to capacity initally)
//         res - HTML event responce 
// Output: None, returns json of the event entries in the database through res
const addEvent = (req, res) => {
    insertEvent(req.body, (error, result) => {
        if (error) {
            return res.status(500).json({ error: "Could not add event" });
        }
        res.status(201).json({ message: "Successfully created event", event: result });
    });
};

// Purpose: Update an event in the sqllite database
//
// Inputs: req - request containing the info of the event to be inserted
//              - eventID: id of event to be updated
//              - title: name of event, description: short description of event
//              - startTime: start time in ISO 8601 format "YYYY-MM-DDTHH:MM:SS"
//              - endTime: end time in ISO 8601 format "YYYY-MM-DDTHH:MM:SS"
//              - venue: name of venue the event will take place in
//              - capacity: max amount of people that can attend event 
//              (available_tickets will be set to capacity initally)
//         res - HTML event responce 
// Output: None, returns json of the event entries in the database through res
const editEvent = (req, res) => {
    const eventID = req.params.id;
    const eventInfo = req.body;

    updateEvent(eventID, eventInfo, (error, result) => {
        if (error) {
            return res.status(500).json({ error: "Could not update event" });
        }
        res.status(200).json({ message: "Successfully updated event", event: result });
    });
};

module.exports = { addEvent, editEvent };

