const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.sqlite');
const { askLLM } = require('./llmService');
const { askLLMToParse } = require('./llmParseService');

router.post('/api/llm/message', async (req, res) => {
  const { message, context } = req.body;
  const result = await askLLM(message, context);
  res.json(result);
});

router.post('/api/llm/parse', async (req, res) => {
  const { text } = req.body;
  const result = await askLLMToParse(text);
  res.json(result);
});

router.post('/api/llm/confirm-booking', (req, res) => {
  const { event, tickets } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.get("SELECT available FROM events WHERE title = ?", [event], (err, row) => {
      if (err || !row) {
        db.run("ROLLBACK");
        return res.status(400).json({ error: "Event not found" });
      }
      if (row.available < tickets) {
        db.run("ROLLBACK");
        return res.status(400).json({ error: "Not enough tickets available" });
      }

      db.run("UPDATE events SET available = available - ? WHERE title = ?", [tickets, event], function (err2) {
        if (err2) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Database error" });
        }
        db.run("COMMIT");
        return res.json({ message: `Successfully booked ${tickets} tickets for ${event}!` });
      });
    });
  });
});

module.exports = router;
