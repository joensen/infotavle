const express = require('express');
const router = express.Router();
const adDiscoveryService = require('../services/adDiscoveryService');

router.get('/', async (req, res) => {
  try {
    const data = await adDiscoveryService.discoverAds();
    res.json(data);
  } catch (error) {
    console.error('Error in ads route:', error);
    res.status(500).json({
      error: 'Failed to discover ads',
      rotating: [],
      static: [],
      lastDiscovered: new Date().toISOString()
    });
  }
});

module.exports = router;
