require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const calendarRouter = require('./routes/calendar');
const adsRouter = require('./routes/ads');
const calendarService = require('./services/calendarService');
const adDiscoveryService = require('./services/adDiscoveryService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/calendar', calendarRouter);
app.use('/api/ads', adsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Clear cache endpoint (for testing)
app.post('/api/clear-cache', (_req, res) => {
  try {
    calendarService.cache.flushAll();
    adDiscoveryService.cache.flushAll();

    console.log('Cache cleared manually');
    res.json({
      success: true,
      message: 'All caches cleared. Next API call will fetch fresh data.'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Infotavle Server Started`);
  console.log(`=================================`);
  console.log(`Port: ${PORT}`);
  console.log(`Time: ${new Date().toLocaleString('da-DK')}`);
  console.log(`=================================`);
  console.log(`Endpoints:`);
  console.log(`  - http://localhost:${PORT}/`);
  console.log(`  - http://localhost:${PORT}/api/calendar`);
  console.log(`  - http://localhost:${PORT}/api/ads`);
  console.log(`  - http://localhost:${PORT}/health`);
  console.log(`  - POST http://localhost:${PORT}/api/clear-cache (for testing)`);
  console.log(`=================================`);
});
