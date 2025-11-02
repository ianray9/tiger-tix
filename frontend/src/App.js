import React, { useEffect, useState } from 'react';
import './App.css';
import LlmBooking from "./LlmBooking";

function App() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');

  // Fetch events from the client microservice (port 6001)
  useEffect(() => {
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
  }, []);

  // Updated to actually purchase a ticket
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

      // Update UI: reduce ticket count
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.eventId === eventId
            ? { ...event, availableTickets: event.availableTickets - 1 }
            : event
        )
      );

      setMessage(`Ticket purchased for: ${eventName}`);
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    }
  };

  return (
    <div className="App">
      {/* Semantic heading structure */}
      <header>
        <h1 tabIndex="0">Clemson Campus Events</h1>
      </header>

      {/* Section landmark for events list */}
      <main role="main">
        <section aria-labelledby="events-heading">
          <h2 id="events-heading" tabIndex="0">Available Events</h2>

          {/* Optional message display */}
          {message && (
            <p role="alert" style={{ color: 'green' }}>
              {message}
            </p>
          )}

          {/* Use semantic list structure with ARIA labeling */}
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

                    {/* Accessible button with clear label */}
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
        <section aria-labelledby="assistant-heading" style={{ marginTop: '2rem' }}>
        <h2 id="assistant-heading">Chat Assistant</h2>
        <LlmBooking />
      </section>
      </main>
    </div>
  );
}

export default App;
