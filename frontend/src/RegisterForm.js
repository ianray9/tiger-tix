import React, { useState } from 'react';

// Get backend URL (gateway URL for production, or use AUTH_URL if set)
const backendURL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_AUTH_URL || '';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!backendURL) {
      setError('Backend URL not configured. Please set REACT_APP_BACKEND_URL environment variable.');
      console.error('Backend URL is missing:', { backendURL, env: process.env });
      return;
    }

    try {
      const url = `${backendURL}/api/auth/register`;
      console.log('Register request to:', url);
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('Register response status:', resp.status, resp.statusText);
      console.log('Register response headers:', Object.fromEntries(resp.headers.entries()));

      // Check if response has content before parsing
      const contentType = resp.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        const text = await resp.text();
        console.log('Register response body:', text);
        try {
          data = text ? JSON.parse(text) : {};
        } catch (parseErr) {
          console.error('Failed to parse JSON:', parseErr, 'Response text:', text);
          setError(`Registration failed: Invalid response from server (${resp.status})`);
          return;
        }
      } else {
        // No JSON content, might be empty response
        console.warn('No JSON content-type, status:', resp.status);
        data = {};
      }

      if (!resp.ok) {
        console.error('Register failed:', { status: resp.status, data });
        setError(data.error || `Registration failed (${resp.status})`);
        return;
      }

      // Success!
      console.log('Registration successful:', data);
      setMessage(data.message || 'Registration successful! You can now log in.');
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Register error:', err);
      setError(`Registration failed: ${err.message}. Check console for details.`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Register</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <label>
          Email:{' '}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Password:{' '}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
      </div>
      <button type="submit">Register</button>
    </form>
  );
}
