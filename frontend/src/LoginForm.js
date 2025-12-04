import React, { useState } from 'react';
import { useAuth } from './AuthContext';

// Get backend URL (gateway URL for production, or use AUTH_URL if set)
const backendURL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_AUTH_URL || '';

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!backendURL) {
      setError('Backend URL not configured. Please set REACT_APP_BACKEND_URL environment variable.');
      console.error('Backend URL is missing:', { backendURL, env: process.env });
      return;
    }

    try {
      const url = `${backendURL}/api/auth/login`;
      console.log('Login request to:', url);
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('Login response status:', resp.status, resp.statusText);
      console.log('Login response headers:', Object.fromEntries(resp.headers.entries()));

      // Check if response has content before parsing
      const contentType = resp.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        const text = await resp.text();
        console.log('Login response body:', text);
        try {
          data = text ? JSON.parse(text) : {};
        } catch (parseErr) {
          console.error('Failed to parse JSON:', parseErr, 'Response text:', text);
          setError(`Login failed: Invalid response from server (${resp.status})`);
          return;
        }
      } else {
        console.warn('No JSON content-type, status:', resp.status);
        data = {};
      }

      if (!resp.ok) {
        console.error('Login failed:', { status: resp.status, data });
        setError(data.error || `Login failed (${resp.status})`);
        return;
      }

      // Success!
      console.log('Login successful:', data);
      if (!data.token) {
        setError('Login failed: No token received from server');
        return;
      }

      // Save user + token in context
      login(data.token, data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError(`Login failed: ${err.message}. Check console for details.`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Login</h2>
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
      <button type="submit">Log In</button>
    </form>
  );
}
