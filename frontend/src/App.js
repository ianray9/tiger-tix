import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));
  }, []);

  const buyTicket = (eventName) => {
    alert(`Ticket purchased for: ${eventName}`);
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

          {/* Use semantic list structure with ARIA labeling */}
          {events.length > 0 ? (
            <ul aria-live="polite" aria-label="List of campus events">
              {events.map((event) => (
                <li key={event.id}>
                  <article
                    aria-label={`Event: ${event.name}`}
                    tabIndex="0"
                    className="event-item"
                  >
                    <p>
                      <strong>{event.name}</strong> — {event.date}
                    </p>

                    {/* Accessible button with clear label */}
                    <button
                      onClick={() => buyTicket(event.name)}
                      aria-label={`Buy ticket for ${event.name}`}
                      className="buy-button"
                    >
                      Buy Ticket for {event.name}
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
    </div>
  );
}

export default App;