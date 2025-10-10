const { insertEvent } = require('../models/adminModel.js');

// Purpose: Create a event to insert into the sqllite database
//
// Inputs: req - request containing the info of the event to be inserted
//         res - HTML event responce 
// Output: None, returns json of the event entries in the database through res
const addEvent = (req, res) => {
    insertEvent(req.body, (error, result) => {
        if (error) {
            return res.status(500).json({ error: "Could not add event" })
        }
        res.status(201).json({ message: "Successfully created event", event: result })
    });
};

module.exports = { addEvent };

