import React, { useState } from 'react';

export default function LlmBooking() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [status, setStatus] = useState('');

  async function handleParse() {
    setStatus('Parsing…');
    const resp = await fetch('/api/llm/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input })
    });
    const data = await resp.json();
    if (!resp.ok) {
      setStatus(data.error || 'Could not parse');
      return;
    }
    setParsed(data.parsed);
    setStatus('');
  }

  async function handleConfirm() {
    if (!parsed || parsed.intent !== 'book') return;
    setStatus('Booking…');
    const body = {
      quantity: parsed.tickets,
      event_id: parsed.event_id,
      event_name: parsed.event // fallback if id missing
    };
    const resp = await fetch('/api/llm/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (resp.ok) {
      setStatus(`Booked! confirmation id: ${data.bookingId}`);
      setParsed(null);
      setInput('');
    } else {
      setStatus(data.error || 'Booking failed');
    }
  }

  return (
    <div>
      <h3>LLM Booking Assistant</h3>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. Book two tickets for Jazz Night" />
      <button onClick={handleParse}>Parse</button>

      {parsed && (
        <div role="region" aria-live="polite">
          {parsed.intent === 'list' && <div>I can show events. <a href="/api/events">View events</a></div>}
          {parsed.intent === 'book' && (
            <div>
              <p>I'll book <strong>{parsed.tickets || 1}</strong> tickets for <strong>{parsed.event || parsed.event_name || 'Unknown event'}</strong>.</p>
              <button onClick={handleConfirm}>Confirm Booking</button>
            </div>
          )}
          {parsed.intent === 'unknown' && <div>Sorry, I didn't understand. Try "Book 2 tickets for Jazz Night".</div>}
        </div>
      )}

      <div aria-live="polite">{status}</div>
    </div>
  );
}
