import React, { useState } from 'react';
import { useAuth } from './AuthContext';

// Get url
const authURL = process.env.REACT_APP_AUTH_URL;

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const resp = await fetch(`${authURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Save user + token in context
      login(data.token, data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
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
