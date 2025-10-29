require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { askLLMToParse } = require('./llmService');
const { getAvailableEvents, getEventByName, getEventById, bookTickets } = require('./db');

const app = express();
app.use(bodyParser.json());

// 1) Greeting endpoint (optional)
app.get('/api/llm/greet', (req, res) => {
  return res.json({ message: "Hi — I'm TigerTix assistant. I can show events and prepare bookings. What would you like to do?" });
});

// 2) Show events (convenience)
app.get('/api/events', (req, res) => {
  const events = getAvailableEvents();
  res.json({ events });
});

// 3) Parse natural language (does NOT book)
app.post('/api/llm/parse', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text in body' });

  try {
    const parsed = await askLLMToParse(text);
    // Validate parsed
    if (!parsed || !parsed.intent) {
      return res.status(422).json({ error: 'Unable to parse request' });
    }

    // When intent=book, try to map event name to event id (best-effort)
    if (parsed.intent === 'book' && parsed.event) {
      // attempt exact name match
      const event = getEventByName(parsed.event);
      if (event) {
        parsed.event_id = event.id;
        parsed.remaining = event.total_tickets - event.tickets_sold;
      } else {
        // not found: still return structured JSON so frontend can ask follow-up
        parsed.event_id = null;
      }
    }

    return res.json({ parsed });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while parsing' });
  }
});

// 4) Confirm booking (actually performs DB transaction)
app.post('/api/llm/confirm', async (req, res) => {
  /**
   * Expected body:
   * { event_id: 1, quantity: 2 }
   * or { event_name: "Jazz Night", quantity: 2 }
   */
  const { event_id, event_name, quantity } = req.body;
  const qty = parseInt(quantity, 10);
  if (!qty || qty <= 0) return res.status(400).json({ error: 'Invalid ticket quantity' });

  try {
    let event;
    if (event_id) event = getEventById(event_id);
    else if (event_name) event = getEventByName(event_name);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Perform booking inside transaction function in db.js
    try {
      const bookingId = bookTickets(event.id, qty);
      return res.json({ success: true, bookingId });
    } catch (err) {
      if (err.message === 'NotEnoughTickets') {
        return res.status(409).json({ error: 'Not enough tickets available' });
      } else if (err.message === 'EventNotFound') {
        return res.status(404).json({ error: 'Event not found' });
      } else {
        console.error('Booking error:', err);
        return res.status(500).json({ error: 'Booking failed' });
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Start
const PORT = process.env.PORT || 7001;
app.listen(PORT, () => console.log(`LLM booking service running on port ${PORT}`));
