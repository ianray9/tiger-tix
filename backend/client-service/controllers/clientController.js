const clientModel = require('../models/clientModel');

// Purpose: Get all events in the shared database from client model
//
// Output: Returns a promise that if resolved will return the rows of 
// events and else the error received from the database
const getEvents = async (req, res) => {
    try {
        const events = await clientModel.getAllEvents();
        if (!events || events.length === 0) {
            return res.status(404).json({ message: 'No events found' });
        }
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// Purpose: Update an event's info to show one less available ticket from client model
// Inputs: req - API request
//              - eventID: the id of the event to decrease available tickets
//         res - resolution code of request
// Output: Returns responce code and message of the request
const purchaseTicket = async (req, res) => {
    try {
        const eventId = req.params.id;
        const result = await clientModel.purchaseTicket(eventId);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Event not found') {
            res.status(404).json({ error: error.message });
        } else if (error.message === 'No tickets available') {
            res.status(400).json({ error: error.message });
        } else {
            console.error('Error purchasing ticket:', error);
            res.status(500).json({ error: 'Failed to purchase ticket' });
        }
    }
};

module.exports = { getEvents, purchaseTicket };
