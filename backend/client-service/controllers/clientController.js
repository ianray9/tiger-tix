const clientModel = require('../models/clientModel');

exports.getEvents = async (req, res) => {
  try {
    const events = await clientModel.getAllEvents();
    if (!events || events.length === 0) {
      return res.status(404).json({ message: 'No events found' });
    }
    res.status(200).json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

exports.purchaseTicket = async (req, res) => {
  try {
    const eventId = req.params.id;
    const result = await clientModel.purchaseTicket(eventId);
    res.status(200).json(result);
  } catch (err) {
    if (err.message === 'Event not found') {
      res.status(404).json({ error: err.message });
    } else if (err.message === 'No tickets available') {
      res.status(400).json({ error: err.message });
    } else {
      console.error('Error purchasing ticket:', err);
      res.status(500).json({ error: 'Failed to purchase ticket' });
    }
  }
};
