const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendarService');

router.get('/', async (req, res) => {
  try {
    const data = await calendarService.fetchAllEvents();
    res.json(data);
  } catch (error) {
    console.error('Error in calendar route:', error);
    res.status(500).json({
      error: 'Failed to fetch calendar events',
      events: [],
      lastUpdated: new Date().toISOString()
    });
  }
});

module.exports = router;
