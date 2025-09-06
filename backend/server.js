const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const schedule = require('node-schedule');
require('dotenv').config();

// Initialize Firebase Admin
const admin = require('./config/firebase');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Import services
const scheduleService = require('./services/scheduleService');
const scrapingService = require('./services/scrapingService');
const notificationService = require('./services/notificationService');
const liveUpdateService = require('./services/liveUpdateService');

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Schedule API endpoint - server-side scraping
app.get('/api/schedule/ut-athletics', async (req, res) => {
  try {
    const schedule = await scrapingService.scrapeUTAthleticsSchedule();
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching UT Athletics schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// ESPN API endpoint
app.get('/api/schedule/espn', async (req, res) => {
  try {
    const schedule = await scheduleService.fetchESPNSchedule();
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching ESPN schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Sync endpoint for manual triggers
app.post('/api/schedule/sync', async (req, res) => {
  try {
    const result = await scheduleService.performFullSync();
    res.json(result);
  } catch (error) {
    console.error('Error syncing schedule:', error);
    res.status(500).json({ error: 'Failed to sync schedule' });
  }
});

// Push notification subscription endpoint
app.post('/api/notifications/subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    await notificationService.saveSubscription(userId, subscription);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join room for specific game updates
  socket.on('join-game', (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`Socket ${socket.id} joined game room: ${gameId}`);
  });
  
  // Leave game room
  socket.on('leave-game', (gameId) => {
    socket.leave(`game-${gameId}`);
    console.log(`Socket ${socket.id} left game room: ${gameId}`);
  });
  
  // Subscribe to all schedule updates
  socket.on('subscribe-schedule', () => {
    socket.join('schedule-updates');
    console.log(`Socket ${socket.id} subscribed to schedule updates`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Cron Jobs

// Daily sync at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Running daily schedule sync...');
  const result = await scheduleService.performFullSync();
  
  // Notify all connected clients
  io.to('schedule-updates').emit('schedule-synced', result);
  
  // Check for schedule changes and send push notifications
  if (result.updated > 0) {
    await notificationService.sendScheduleUpdateNotifications(result.changes);
  }
});

// Check for live games every 30 seconds during game times
let liveGameInterval = null;

async function startLiveGameMonitoring() {
  const activeGames = await liveUpdateService.getActiveGames();
  
  if (activeGames.length > 0 && !liveGameInterval) {
    console.log('Starting live game monitoring...');
    
    liveGameInterval = setInterval(async () => {
      for (const game of activeGames) {
        const updates = await liveUpdateService.fetchLiveUpdates(game.espnGameId);
        
        if (updates) {
          // Send updates to clients watching this game
          io.to(`game-${game.id}`).emit('game-update', updates);
          
          // Update database
          await scheduleService.updateGameData(game.id, updates);
          
          // Send push notifications for major events (scoring plays, game end)
          if (updates.majorEvent) {
            await notificationService.sendGameEventNotification(game, updates);
          }
        }
      }
      
      // Check if games are still active
      const stillActive = await liveUpdateService.getActiveGames();
      if (stillActive.length === 0 && liveGameInterval) {
        console.log('Stopping live game monitoring - no active games');
        clearInterval(liveGameInterval);
        liveGameInterval = null;
      }
    }, 30000); // Every 30 seconds
  }
}

// Check for game starts every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await startLiveGameMonitoring();
});

// TV Network announcement check (every day at 10 AM and 4 PM)
cron.schedule('0 10,16 * * *', async () => {
  console.log('Checking for TV network updates...');
  const updates = await scheduleService.checkNetworkUpdates();
  
  if (updates.length > 0) {
    // Notify clients
    io.to('schedule-updates').emit('network-updates', updates);
    
    // Send push notifications
    await notificationService.sendNetworkAnnouncementNotifications(updates);
  }
});

// Bowl game check (December and January, daily at noon)
cron.schedule('0 12 * 12,1 *', async () => {
  console.log('Checking for bowl game announcements...');
  const bowlGames = await scheduleService.checkForBowlGames();
  
  if (bowlGames.length > 0) {
    // Notify all clients
    io.emit('bowl-announcement', bowlGames);
    
    // Send push notifications
    await notificationService.sendBowlGameNotifications(bowlGames);
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});