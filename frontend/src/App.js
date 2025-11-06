import React, { useEffect, useState } from 'react';
import './App.css';
import LlmBooking from "./LlmBooking";
import LlmVoice from "./LlmVoice";
import './LlmVoice.css';

function App() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');

  // ✅ Centralized fetch function so UI can refresh
  const fetchEvents = () => {
    fetch('http://localhost:6001/api/events')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
      })
      .then((data) => setEvents(data))
      .catch((err) => {
        console.error(err);
        setMessage('Could not load events.');
      });
  };

  // ✅ Load events on first page load
  useEffect(() => {
    fetchEvents();
  }, []);

  // ✅ Refresh events whenever LLM completes a booking
  useEffect(() => {
    const handler = () => {
      console.log("LLM booking detected → refreshing events");
      fetchEvents();
    };

    window.addEventListener('llm-booked', handler);
    return () => window.removeEventListener('llm-booked', handler);
  }, []);

  // ✅ Standard buy ticket (manual UI button)
  const buyTicket = async (eventId, eventName) => {
    try {
      const response = await fetch(`http://localhost:6001/api/events/${eventId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Purchase failed');
      }

      // ✅ After purchase, refresh list
      fetchEvents();

      setMessage(`Ticket purchased for: ${eventName}`);
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    }
  };

  return (
    <div className="App">
      <header>
        <h1 tabIndex="0">Clemson Campus Events</h1>
      </header>

      <main role="main">
        <section aria-labelledby="events-heading">
          <h2 id="events-heading" tabIndex="0">Available Events</h2>

          {message && (
            <p role="alert" style={{ color: 'green' }}>
              {message}
            </p>
          )}

          {events.length > 0 ? (
            <ul aria-live="polite" aria-label="List of campus events">
              {events.map((event) => (
                <li key={event.eventId}>
                  <article
                    aria-label={`Event: ${event.title}`}
                    tabIndex="0"
                    className="event-item"
                  >
                    <p>
                      <strong>{event.title}</strong> — {event.startTime}
                    </p>
                    <p>Tickets Available: {event.availableTickets}</p>

                    <button
                      onClick={() => buyTicket(event.eventId, event.title)}
                      aria-label={`Buy ticket for ${event.title}`}
                      className="buy-button"
                      disabled={event.availableTickets <= 0}
                    >
                      {event.availableTickets > 0
                        ? `Buy Ticket for ${event.title}`
                        : 'Sold Out'}
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" aria-live="polite">
              Loading events or no events available.
            </p>
          )}
        </section>
      </main>

      <LlmBooking />
      <LlmVoice
        onTranscript={(text) => {
          const inputField = document.querySelector('.input-area input');
          if (inputField) {
            inputField.value = text;
            inputField.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }}
      />
    </div>
  );
}

export default App;
