import React, { useEffect, useState } from 'react';
import './App.css';
import LlmBooking from "./LlmBooking";
import LlmVoice from "./LlmVoice";
import './LlmVoice.css';

import { useAuth } from './AuthContext';  
import LoginForm from './LoginForm';         
import RegisterForm from './RegisterForm';

function App() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');

  const { user, isAuthenticated, logout, token } = useAuth();

  // Centralized fetch function so UI can refresh
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

  // Load events on first page load
  useEffect(() => {
    fetchEvents();
  }, []);

  // Refresh events whenever LLM completes a booking
  useEffect(() => {
    const handler = () => {
      console.log("LLM booking detected → refreshing events");
      fetchEvents();
    };

    window.addEventListener('llm-booked', handler);
    return () => window.removeEventListener('llm-booked', handler);
  }, []);

  // Standard buy ticket (manual UI button) – we'll protect this with JWT later
  const buyTicket = async (eventId, eventName) => {
  try {
    if (!token) {
      setMessage('You must be logged in to buy tickets.');
      return;
    }

    const response = await fetch(`http://localhost:6001/api/events/${eventId}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,    // ⬅️ send JWT
      },
    });

    const result = await response.json();

    if (response.status === 401) {
      // Token missing, invalid, or expired → force logout and show login
      logout();
      setMessage('Session expired or not authorized. Please log in again.');
      return;
    }

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

        {/* 🔐 Auth UI */}
        <div style={{ marginTop: '1rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span>Logged in as <strong>{user.email}</strong></span>
              <button onClick={logout}>Logout</button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: '2rem',
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <LoginForm />
              <RegisterForm />
            </div>
          )}
        </div>
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
