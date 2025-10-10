const express = require('express');
const router = express.Router();
const { addEvent } = require('../controllers/adminController.js');

router.post('/events', addEvent);

module.exports = router;

