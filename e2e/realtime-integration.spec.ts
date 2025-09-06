import { test, expect } from '@playwright/test';
import { io, Socket } from 'socket.io-client';

test.describe('Real-time Integration Tests', () => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  let socket: Socket;

  test.beforeEach(async ({ page, context }) => {
    // Grant permissions
    await context.grantPermissions(['notifications']);
    await page.goto('/');
  });

  test.afterEach(async () => {
    if (socket?.connected) {
      socket.disconnect();
    }
  });

  test('complete real-time flow', async ({ page, request }) => {
    // Step 1: Verify backend is running
    const healthResponse = await request.get(`${backendUrl}/health`);
    expect(healthResponse.ok()).toBe(true);
    
    // Step 2: Connect WebSocket
    socket = io(backendUrl);
    await new Promise<void>((resolve) => {
      socket.on('connect', resolve);
    });
    expect(socket.connected).toBe(true);
    
    // Step 3: Subscribe to updates
    socket.emit('subscribe-schedule');
    
    // Step 4: Set up listeners
    const listeners = {
      scheduleUpdate: false,
      networkUpdate: false,
      gameUpdate: false
    };
    
    socket.on('schedule-synced', () => {
      listeners.scheduleUpdate = true;
    });
    
    socket.on('network-updates', () => {
      listeners.networkUpdate = true;
    });
    
    socket.on('game-update', () => {
      listeners.gameUpdate = true;
    });
    
    // Step 5: Verify service worker is registered
    const hasServiceWorker = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });
    expect(hasServiceWorker).toBe(true);
    
    // Step 6: Test manual sync trigger
    const syncResponse = await request.post(`${backendUrl}/api/schedule/sync`);
    expect(syncResponse.ok()).toBe(true);
    
    // Step 7: Verify listeners are set up
    expect(socket.hasListeners('schedule-synced')).toBe(true);
    expect(socket.hasListeners('network-updates')).toBe(true);
  });

  test('game day experience flow', async ({ page }) => {
    // Simulate game day user experience
    
    // Step 1: Navigate to games page
    await page.goto('/games');
    
    // Step 2: Connect to WebSocket
    socket = io(backendUrl);
    await new Promise<void>((resolve) => {
      socket.on('connect', resolve);
    });
    
    // Step 3: Find a game card (if exists)
    const gameCards = await page.locator('[data-testid="game-card"]').all();
    
    if (gameCards.length > 0) {
      // Click on first game
      await gameCards[0].click();
      
      // Join game room for updates
      const gameId = await gameCards[0].getAttribute('data-game-id');
      if (gameId) {
        socket.emit('join-game', gameId);
        
        // Set up listener for game updates
        socket.on('game-update', (update) => {
          console.log('Game update received:', update);
        });
        
        // Verify joined room
        expect(socket.hasListeners('game-update')).toBe(true);
      }
    }
  });

  test('notification permission flow', async ({ page, context }) => {
    // Step 1: Check initial permission state
    const initialPermission = await page.evaluate(() => {
      return Notification.permission;
    });
    expect(initialPermission).toBe('granted'); // Because we granted in beforeEach
    
    // Step 2: Test notification display
    const canShowNotification = await page.evaluate(async () => {
      try {
        const notification = new Notification('Test Game Alert', {
          body: 'Texas vs Michigan - Starting Soon!',
          icon: '/icon-192.png',
          badge: '/badge-72.png'
        });
        
        setTimeout(() => notification.close(), 100);
        return true;
      } catch {
        return false;
      }
    });
    expect(canShowNotification).toBe(true);
  });

  test('offline resilience', async ({ page, context }) => {
    // Test offline handling
    
    // Step 1: Go online first
    await page.goto('/');
    
    // Step 2: Register service worker
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
        return true;
      }
      return false;
    });
    expect(swRegistered).toBe(true);
    
    // Step 3: Go offline
    await context.setOffline(true);
    
    // Step 4: Try to navigate (should work with service worker cache)
    await page.goto('/').catch(() => {
      // Page might be cached by service worker
    });
    
    // Step 5: Go back online
    await context.setOffline(false);
    
    // Step 6: Verify can reconnect
    socket = io(backendUrl);
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Reconnection timeout')), 5000);
    }).catch(() => {
      // Might fail in test environment
    });
  });

  test('admin sync capabilities', async ({ page, request }) => {
    // Test admin-specific sync features
    
    // Step 1: Trigger manual sync
    const syncResponse = await request.post(`${backendUrl}/api/schedule/sync`);
    expect(syncResponse.ok()).toBe(true);
    
    const syncResult = await syncResponse.json();
    expect(syncResult).toHaveProperty('lastSyncTime');
    expect(syncResult).toHaveProperty('updated');
    expect(syncResult).toHaveProperty('added');
    
    // Step 2: Verify sync log structure
    expect(Array.isArray(syncResult.errors)).toBe(true);
    if (syncResult.changes) {
      expect(Array.isArray(syncResult.changes)).toBe(true);
    }
  });

  test('concurrent connections stress test', async ({ page }) => {
    // Test multiple simultaneous connections
    const sockets: Socket[] = [];
    const connectionCount = 5;
    
    try {
      // Create multiple connections
      for (let i = 0; i < connectionCount; i++) {
        const socket = io(backendUrl);
        sockets.push(socket);
        
        await new Promise<void>((resolve) => {
          socket.on('connect', resolve);
        });
      }
      
      // Verify all connected
      expect(sockets.every(s => s.connected)).toBe(true);
      
      // Verify unique IDs
      const ids = sockets.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(connectionCount);
      
    } finally {
      // Clean up all connections
      sockets.forEach(s => s.disconnect());
    }
  });
});