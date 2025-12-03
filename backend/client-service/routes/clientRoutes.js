const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// JWT auth
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Purpose: Authenicate user tokene
// Inputs: req - API request
//         res - resolution code of request
//         next - function for next step in auth
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT error:", err.message);
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    req.user = decoded;    // Store decoded token payload
    next();
  });
}

// Public route: anyone can view events
router.get('/events', clientController.getEvents);

// Protected route: must be logged in to purchase
router.post('/events/:id/purchase', authMiddleware, clientController.purchaseTicket);

module.exports = router;
