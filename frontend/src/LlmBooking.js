import React, { useState } from 'react';
import './LlmBooking.css';

export default function LlmBooking() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi there! I can help you book tickets for campus events. Try typing “Book two tickets for Jazz Night.”'
    }
  ]);

  async function handleParse() {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setStatus('Parsing…');

    try {
      const resp = await fetch('/api/llm/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });

      const data = await resp.json();

      if (!resp.ok) {
        const errMsg = { sender: 'bot', text: data.error || 'Could not parse your request.' };
        setMessages(prev => [...prev, errMsg]);
        setStatus('');
        return;
      }

      setParsed(data.parsed);
      setStatus('');

      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: `Here’s what I understood: ${JSON.stringify(data.parsed, null, 2)}` }
      ]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error connecting to LLM service.' }]);
    }

    setInput('');
  }

  async function handleConfirm() {
    if (!parsed || parsed.intent !== 'book') return;
    setStatus('Booking…');

    const body = {
      quantity: parsed.tickets,
      event_id: parsed.event_id,
      event_name: parsed.event
    };

    const resp = await fetch('/api/llm/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await resp.json();

    if (resp.ok && data.success) {
      const name = data.event?.title || parsed.event || 'your event';
      const remainingText =
      typeof data.remaining === 'number'
        ? ` Tickets remaining: ${data.remaining}.`
        : '';

     setMessages(prev => [
      ...prev,
        { sender: 'bot', text: `✅ Booking confirmed for ${name}.${remainingText}` }
      ]);
      setParsed(null);

    // Refresh event list so the seat count updates
    window.dispatchEvent(new Event('llm-booked'));
    } else {
    setMessages(prev => [...prev, { sender: 'bot', text: data.error || 'Booking failed.' }]);
    } 

    setStatus('');
  }

  return (
    <div className={`chatbot-container ${open ? 'open' : ''}`}>
      <div className="chat-header" onClick={() => setOpen(!open)}>
        Booking Assistant
      </div>

      {open && (
        <div className="chat-body">
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>

          {parsed?.intent === 'book' && (
            <button className="confirm-btn" onClick={handleConfirm}>
              Confirm Booking
            </button>
          )}

          <div className="input-area">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me about events..."
              onKeyDown={e => e.key === 'Enter' && handleParse()}
            />
            <button onClick={handleParse}>Send</button>
          </div>

          {status && <div className="status">{status}</div>}
        </div>
      )}
    </div>
  );
}
