require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { askLLMToParse } = require('./llmParseService');
const { getEventByName, getEventById, bookTickets } = require('./db');

const app = express();
app.use(bodyParser.json());


app.get('/api/llm/health', (req, res) => {
    res.json({ status: 'ok', service: 'llm-booking' });
});


app.get('/api/llm/greet', (req, res) => {
    return res.json({
        message:
            "Hi — I'm the TigerTix booking assistant. Ask me about events or start a booking!"
    });
});


app.post('/api/llm/parse', async (req, res) => {
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Missing text in body' });
    }

    try {
        const parsed = await askLLMToParse(text);

        if (!parsed || !parsed.intent) {
            return res.status(422).json({ error: 'Unable to parse request' });
        }

        // If intent = "book", try to identify event
        if (parsed.intent === 'book' && parsed.event) {
            const event = await getEventByName(parsed.event);

            if (event) {
                parsed.event_id = event.eventId;
                parsed.remaining = event.availableTickets;
            } else {
                parsed.event_id = null;
            }
        }

        return res.json({ parsed });
    } catch (err) {
        console.error('❌ Parse error:', err);
        return res.status(500).json({ error: 'Server error while parsing input.' });
    }
});

app.post('/api/llm/confirm', async (req, res) => {
    const { event_id, event_name, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (!qty || qty <= 0) {
        return res.status(400).json({ error: 'Invalid ticket quantity' });
    }

    try {
        let event = null;
        if (event_id) event = await getEventById(event_id);
        else if (event_name) event = await getEventByName(event_name);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        try {
            const bookingResult = await bookTickets(event.eventId, qty);

            return res.json({
                success: true,
                event: { eventId: event.eventId, title: event.title },
                remaining: bookingResult.remaining
            });
        } catch (err) {
            if (err.message === 'NotEnoughTickets') {
                return res.status(409).json({ error: 'Not enough tickets available' });
            }
            if (err.message === 'EventNotFound') {
                return res.status(404).json({ error: 'Event not found' });
            }

            console.error('❌ Booking error:', err);
            return res.status(500).json({ error: 'Booking failed' });
        }
    } catch (err) {
        console.error('❌ Confirm error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


const PORT = process.env.PORT || 7001;
app.listen(PORT, () =>
    console.log(`✅ LLM booking service running on port ${PORT}`)
);
