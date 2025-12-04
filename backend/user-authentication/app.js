const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { generateKey } = require('crypto');

const PORT = process.env.AUTH_PORT || 7002;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_EXPIRY = '30m';

// Purpose: Helper function to generate JWT
// Inputs: user - user to generate JWT for 
// Output: JWT for user
function generateToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );
}

// Purpose: Simple JWT auth middleware
// Inputs: req - API request
//         res - resolution code of request
//         next - function for next step in auth process
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({ error: 'Missing auth token.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('JWT verify error:', err.message);
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }
        req.user = decoded; // { userId, email, iat, exp }
        next();
    });
}

// Purpose: Create user auth service 
// Inputs:  db - db to use in the auth service
// Output: express app fo user auth service
function createApp(db) {
    const app = express();

    // Middleware
    app.use(express.json());
    // CORS is handled by the gateway, but allow all origins here as fallback
    // The gateway will enforce proper CORS policies
    app.use(cors({
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
    }));

    // Create users table if it doesn't exist
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);


    // POST /api/auth/register
    app.post('/api/auth/register', (req, res) => {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const normalizedEmail = String(email).toLowerCase();
        const passwordHash = bcrypt.hashSync(password, 10);
        const createdAt = new Date().toISOString();

        const sql = `
    INSERT INTO users (email, password_hash, created_at)
    VALUES (?, ?, ?)
  `;

        db.run(sql, [normalizedEmail, passwordHash, createdAt], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ error: 'Email already registered.' });
                }
                console.error('Register error:', err);
                return res.status(500).json({ error: 'Registration failed.' });
            }

            return res.status(201).json({
                message: 'User registered successfully.',
                user: { id: this.lastID, email: normalizedEmail }
            });
        });
    });

    // POST /api/auth/login
    app.post('/api/auth/login', (req, res) => {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const normalizedEmail = String(email).toLowerCase();

        db.get(
            'SELECT id, email, password_hash FROM users WHERE email = ?',
            [normalizedEmail],
            (err, user) => {
                if (err) {
                    console.error('Login query error:', err);
                    return res.status(500).json({ error: 'Login failed.' });
                }

                if (!user) {
                    return res.status(401).json({ error: 'Invalid email or password.' });
                }

                const ok = bcrypt.compareSync(password, user.password_hash);
                if (!ok) {
                    return res.status(401).json({ error: 'Invalid email or password.' });
                }

                const token = generateToken(user);

                // For this project we’ll return the token in JSON.
                // (You can later move to httpOnly cookies if needed.)
                return res.json({
                    message: 'Login successful.',
                    token,
                    user: { id: user.id, email: user.email }
                });
            }
        );
    });


    // Example protected route (for testing)
    app.get('/api/auth/me', authMiddleware, (req, res) => {
        res.json({ user: { id: req.user.userId, email: req.user.email } });
    });

    return app;
}

module.exports = {
    createApp,
    JWT_SECRET,
    _test: {
        generateToken,
        authMiddleware
    }
};
