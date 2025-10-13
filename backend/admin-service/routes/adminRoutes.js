const express = require('express');
const router = express.Router();
const { addEvent, editEvent } = require('../controllers/adminController.js');

router.post('/events', addEvent);
router.put('/events/:id', editEvent);

module.exports = router;

