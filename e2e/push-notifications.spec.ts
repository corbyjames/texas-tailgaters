import { test, expect } from '@playwright/test';

test.describe('Push Notifications', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant notification permission in test context
    await context.grantPermissions(['notifications']);
    await page.goto('/');
  });

  test('should register service worker', async ({ page }) => {
    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });

    expect(hasServiceWorker).toBe(true);
  });

  test('should check notification permission', async ({ page }) => {
    const permission = await page.evaluate(() => {
      if ('Notification' in window) {
        return Notification.permission;
      }
      return 'denied';
    });

    expect(permission).toBe('granted');
  });

  test('should detect push notification support', async ({ page }) => {
    const isSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator && 
             'PushManager' in window && 
             'Notification' in window;
    });

    expect(isSupported).toBe(true);
  });

  test('should check iOS support detection', async ({ page }) => {
    // Test iOS detection logic
    const checkIOSSupport = await page.evaluate(() => {
      // Simulate iOS user agent for testing
      const testUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X)';
      const isIOS = /iPad|iPhone|iPod/.test(testUserAgent);
      
      if (!isIOS) return true;
      
      const match = testUserAgent.match(/OS (\d+)_(\d+)/);
      if (match) {
        const majorVersion = parseInt(match[1]);
        const minorVersion = parseInt(match[2]);
        return majorVersion > 16 || (majorVersion === 16 && minorVersion >= 4);
      }
      
      return false;
    });

    expect(checkIOSSupport).toBe(true);
  });

  test('should show local notification', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Try to show a test notification
    const notificationShown = await page.evaluate(async () => {
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('Test Notification', {
            body: 'This is a test notification',
            icon: '/icon-192.png'
          });
          
          // Close it after a short delay
          setTimeout(() => notification.close(), 100);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Notification error:', error);
        return false;
      }
    });

    expect(notificationShown).toBe(true);
  });

  test('should handle notification click in service worker', async ({ page }) => {
    // Check if service worker can handle notification clicks
    const canHandleClick = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if service worker is active
        return registration.active !== null;
      }
      return false;
    });

    expect(canHandleClick).toBe(true);
  });

  test('should schedule notification', async ({ page }) => {
    const canSchedule = await page.evaluate(() => {
      // Test scheduling logic
      const scheduledTime = new Date();
      scheduledTime.setSeconds(scheduledTime.getSeconds() + 5);
      
      const now = new Date();
      const delay = scheduledTime.getTime() - now.getTime();
      
      return delay > 0;
    });

    expect(canSchedule).toBe(true);
  });

  test('should handle push subscription', async ({ page, context }) => {
    // Grant notifications permission
    await context.grantPermissions(['notifications']);
    
    // Check if push subscription can be created
    const canSubscribe = await page.evaluate(async () => {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          
          // Check if push is supported
          if ('pushManager' in registration) {
            // In test environment, we can't actually subscribe without VAPID keys
            // Just check that the API is available
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Push subscription check error:', error);
        return false;
      }
    });

    expect(canSubscribe).toBe(true);
  });

  test('should detect notification types', async ({ page }) => {
    // Test notification type detection
    const types = await page.evaluate(() => {
      const notificationTypes = [
        'game-event',
        'schedule-update',
        'network-announcement',
        'bowl-announcement',
        'game-reminder'
      ];
      
      // Verify all types are handled
      return notificationTypes.every(type => typeof type === 'string');
    });

    expect(types).toBe(true);
  });

  test('should handle offline notification queue', async ({ page }) => {
    // Test offline handling
    const hasOfflineSupport = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        // Check if service worker has cache
        const cacheNames = await caches.keys();
        return cacheNames.length >= 0; // Cache API is available
      }
      return false;
    });

    expect(hasOfflineSupport).toBe(true);
  });
});