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
    const eventInfo = req.body;

    const errors = validateInput(eventInfo);
    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(" ") })
    }

    insertEvent(req.body, (error, result) => {
        if (error) {
            return res.status(500).json({ error: 'Could not add event' });
        }
        res.status(201).json({ message: 'Successfully created event', event: result });
    });
};

// Purpose: Update an event in the sqllite database
//
// Inputs: req - request containing the info of the event to be inserted
//              - eventId: id of event to be updated
//              - title: name of event, description: short description of event
//              - startTime: start time in ISO 8601 format "YYYY-MM-DDTHH:MM:SS"
//              - endTime: end time in ISO 8601 format "YYYY-MM-DDTHH:MM:SS"
//              - venue: name of venue the event will take place in
//              - capacity: max amount of people that can attend event 
//              (available_tickets will be set to capacity initally)
//         res - HTML event responce 
// Output: None, returns json of the event entries in the database through res
const editEvent = (req, res) => {
    const eventId = req.params.id;
    const eventInfo = req.body;

    const errors = validateUpdate(eventInfo);
    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(" ") })
    }

    updateEvent(eventId, eventInfo, (error, result) => {
        if (error) {
            return res.status(500).json({ error: 'Could not update event' });
        }
        res.status(200).json({ message: 'Successfully updated event', event: result });
    });
};

// Purpose: Helper funct to validate base inputs for event
//
// Inputs: event: event info from the req
// Output: a list of errors that give feedback on incorrect inputs for event
function validateInput(event) {
    const errors = [];

    const strInputs = ['title', 'venue'];
    for (const input of strInputs) {
        if (
            !event[input] ||
            typeof event[input] !== 'string' ||
            event[input].trim() === ''
        ) {
            errors.push(`${input} is required and must be a non empty string.`)
        }
    }

    if (event.description && typeof event.description !== 'string') {
        errors.push('description must be a string');
    }

    // Check for ISO format for dates
    const timeInputs = ['startTime', 'endTime'];
    for (const input of timeInputs) {
        if (!event[input] || isNaN(Date.parse(event[input]))) {
            errors.push(`${input} is required and must be a valid ISO date.`);
        }
    }

    if (Date.parse(event.startTime) >= Date.parse(event.endTime)) {
        errors.push('startTime must be before endTime.');
    }

    if (
        event.capacity == null ||
        typeof event.capacity !== 'number' ||
        event.capacity < 0
    ) {
        errors.push('Capacity is required and must be a number >= 0.');
    }

    return errors;
}

// Purpose: Helper funct to validate base inputs and update inputs for event put
//
// Inputs: event: event info from the req
// Output: a list of errors that give feedback on incorrect inputs for event
function validateUpdate(event) {
    let errors = validateInput(event);

    if (
        event.availableTickets == null ||
        typeof event.availableTickets !== 'number' ||
        event.availableTickets < 0 ||
        event.availableTickets > event.capacity
    ) {
        errors.push('availableTickets must be < capacity and >= 0.');
    }

    return errors;
}

module.exports = { addEvent, editEvent };
