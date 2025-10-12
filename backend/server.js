const express = require('express');
const cors = require('cors');
const { syncScoresToFirebase } = require('./espn-sync-service');
const jobScheduler = require('./services/jobScheduler');
const enhancedSyncService = require('./services/enhancedSyncService');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (adjust in production)
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Texas Tailgaters Score Sync Service',
    scheduler: jobScheduler.isRunning ? 'running' : 'stopped',
    timestamp: new Date().toISOString()
  });
});

// ==================== Sync Endpoints ====================

// Legacy sync scores endpoint (kept for backwards compatibility)
app.post('/api/sync-scores', async (req, res) => {
  try {
    console.log('Received request to sync scores (legacy endpoint)');
    const result = await syncScoresToFirebase();

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        updatedGames: result.updates
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in sync-scores endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// New comprehensive sync endpoint
app.post('/api/sync', async (req, res) => {
  try {
    const { type = 'comprehensive' } = req.body;
    console.log(`Received request for ${type} sync`);

    const result = await jobScheduler.triggerManualSync(type);

    res.json({
      success: result.success !== false,
      result
    });
  } catch (error) {
    console.error('Error in sync endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Sync schedule only
app.post('/api/sync/schedule', async (req, res) => {
  try {
    console.log('Received request to sync schedule');
    const result = await enhancedSyncService.syncSchedule();

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error in schedule sync:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Sync scores only
app.post('/api/sync/scores', async (req, res) => {
  try {
    console.log('Received request to sync scores');
    const result = await enhancedSyncService.syncScores();

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error in scores sync:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ==================== Status & Monitoring Endpoints ====================

// Get scheduler status
app.get('/api/scheduler/status', (req, res) => {
  try {
    const status = jobScheduler.getStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting scheduler status',
      error: error.message
    });
  }
});

// Get job history
app.get('/api/scheduler/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = jobScheduler.getHistory(limit);

    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Error getting job history:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting job history',
      error: error.message
    });
  }
});

// ==================== Legacy Endpoints ====================

// Get current scores endpoint (for testing)
app.get('/api/scores', async (req, res) => {
  try {
    const { fetchESPNScores } = require('./espn-sync-service');
    const scores = await fetchESPNScores();
    res.json({
      success: true,
      scores: scores,
      count: scores.length
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scores',
      error: error.message
    });
  }
});

// ==================== Server Initialization ====================

const server = app.listen(PORT, async () => {
  console.log('\n========================================');
  console.log('Texas Tailgaters Score Sync Service');
  console.log('========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\nEndpoints:');
  console.log(`  Health:           GET  http://localhost:${PORT}/health`);
  console.log(`  Sync (all):       POST http://localhost:${PORT}/api/sync`);
  console.log(`  Sync Schedule:    POST http://localhost:${PORT}/api/sync/schedule`);
  console.log(`  Sync Scores:      POST http://localhost:${PORT}/api/sync/scores`);
  console.log(`  Scheduler Status: GET  http://localhost:${PORT}/api/scheduler/status`);
  console.log(`  Job History:      GET  http://localhost:${PORT}/api/scheduler/history`);
  console.log('========================================\n');

  // Initialize job scheduler
  try {
    await jobScheduler.initialize();
  } catch (error) {
    console.error('Error initializing job scheduler:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await jobScheduler.shutdown();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await jobScheduler.shutdown();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});