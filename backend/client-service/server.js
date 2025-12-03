const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'; // same as auth service

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
      console.error('JWT verify error in client-service:', err.message);
      // This will catch expired tokens too
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    req.user = decoded; // { userId, email, iat, exp }
    next();
  });
}

const express = require('express');
const cors = require('cors');
const clientRoutes = require('./routes/clientRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', clientRoutes);

const PORT = process.env.PORT || 6001;
app.listen(PORT, () => {
  console.log(`Client service running on port ${PORT}`);
});