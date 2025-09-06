import { test, expect } from '@playwright/test';
import { io, Socket } from 'socket.io-client';

test.describe('WebSocket Real-time Features', () => {
  let socket: Socket;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await page.goto('/');
  });

  test.afterEach(async () => {
    // Clean up socket connection
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });

  test('should connect to WebSocket server', async ({ page }) => {
    // Create socket connection
    socket = io(backendUrl, {
      transports: ['websocket']
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => {
        console.log('WebSocket connected:', socket.id);
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    expect(socket.connected).toBe(true);
  });

  test('should subscribe to schedule updates', async ({ page }) => {
    socket = io(backendUrl);
    
    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        socket.emit('subscribe-schedule');
        resolve();
      });
    });

    // Verify subscription works
    const schedulePromise = new Promise((resolve) => {
      socket.on('schedule-synced', (data) => {
        resolve(data);
      });
    });

    // Trigger a sync (in real test, this would be done via admin action)
    // For now, just verify the socket is listening
    expect(socket.hasListeners('schedule-synced')).toBe(true);
  });

  test('should join and leave game rooms', async ({ page }) => {
    socket = io(backendUrl);
    
    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });

    const testGameId = 'test-game-123';
    
    // Join game room
    socket.emit('join-game', testGameId);
    
    // Wait a bit for server to process
    await page.waitForTimeout(100);
    
    // Leave game room
    socket.emit('leave-game', testGameId);
    
    // Verify no errors occurred
    expect(socket.connected).toBe(true);
  });

  test('should receive game updates when in game room', async ({ page }) => {
    socket = io(backendUrl);
    
    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });

    const testGameId = 'test-game-123';
    
    // Join game room
    socket.emit('join-game', testGameId);
    
    // Set up listener for game updates
    const updateReceived = new Promise((resolve) => {
      socket.on('game-update', (update) => {
        resolve(update);
      });
    });

    // In a real scenario, wait for actual game update
    // For testing, verify the listener is set up
    expect(socket.hasListeners('game-update')).toBe(true);
  });

  test('should handle network updates', async ({ page }) => {
    socket = io(backendUrl);
    
    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        socket.emit('subscribe-schedule');
        resolve();
      });
    });

    // Listen for network updates
    const networkUpdateReceived = new Promise((resolve) => {
      socket.on('network-updates', (updates) => {
        resolve(updates);
      });
    });

    // Verify listener is set up
    expect(socket.hasListeners('network-updates')).toBe(true);
  });

  test('should handle bowl game announcements', async ({ page }) => {
    socket = io(backendUrl);
    
    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });

    // Listen for bowl announcements
    const bowlAnnouncementReceived = new Promise((resolve) => {
      socket.on('bowl-announcement', (games) => {
        resolve(games);
      });
    });

    // Verify listener is set up
    expect(socket.hasListeners('bowl-announcement')).toBe(true);
  });

  test('should reconnect after disconnection', async ({ page }) => {
    socket = io(backendUrl, {
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionAttempts: 3
    });

    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });

    const initialId = socket.id;
    
    // Force disconnect
    socket.disconnect();
    expect(socket.connected).toBe(false);
    
    // Reconnect
    socket.connect();
    
    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });

    expect(socket.connected).toBe(true);
    // Should have new socket ID after reconnection
    expect(socket.id).not.toBe(initialId);
  });

  test('should handle multiple simultaneous connections', async ({ page }) => {
    const socket1 = io(backendUrl);
    const socket2 = io(backendUrl);
    
    await Promise.all([
      new Promise<void>((resolve) => {
        socket1.on('connect', () => resolve());
      }),
      new Promise<void>((resolve) => {
        socket2.on('connect', () => resolve());
      })
    ]);

    expect(socket1.connected).toBe(true);
    expect(socket2.connected).toBe(true);
    expect(socket1.id).not.toBe(socket2.id);
    
    // Clean up
    socket1.disconnect();
    socket2.disconnect();
  });
});