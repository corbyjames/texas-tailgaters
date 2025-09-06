/**
 * Service Worker for Texas Tailgaters
 * Handles push notifications and offline functionality
 */

// Cache version
const CACHE_VERSION = 'v1';
const CACHE_NAME = `texas-tailgaters-${CACHE_VERSION}`;

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/badge-72.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('texas-tailgaters-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let data = {
    title: '🏈 Texas Tailgaters',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png'
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'texas-tailgaters',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    timestamp: Date.now()
  };
  
  // Special handling for different notification types
  if (data.data?.type === 'game-event') {
    options.requireInteraction = true;
    options.vibrate = [500, 200, 500];
  }
  
  if (data.data?.type === 'bowl-announcement') {
    options.requireInteraction = true;
    options.vibrate = [1000];
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = '/';
  
  // Handle different notification types
  switch (data.type) {
    case 'game-event':
    case 'game-reminder':
      url = `/games/${data.gameId}`;
      break;
    case 'schedule-update':
      url = '/games';
      break;
    case 'bowl-announcement':
      url = `/games/${data.gameId}`;
      break;
    case 'network-announcement':
      url = `/games/${data.gameId}`;
      break;
    default:
      url = '/';
  }
  
  // Handle action clicks
  if (event.action === 'view') {
    url = `/games/${data.gameId}`;
  } else if (event.action === 'rsvp') {
    url = `/games/${data.gameId}/rsvp`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            return client.navigate(url);
          }
        }
        // Open new window if no existing window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'sync-rsvp') {
    event.waitUntil(syncRSVPs());
  }
});

// Sync offline RSVPs
async function syncRSVPs() {
  try {
    // Get pending RSVPs from IndexedDB or localStorage
    const pendingRSVPs = await getPendingRSVPs();
    
    for (const rsvp of pendingRSVPs) {
      try {
        const response = await fetch('/api/rsvp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(rsvp)
        });
        
        if (response.ok) {
          await removePendingRSVP(rsvp.id);
        }
      } catch (error) {
        console.error('Failed to sync RSVP:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing RSVPs:', error);
  }
}

// Helper functions for IndexedDB (simplified)
async function getPendingRSVPs() {
  // Implementation would use IndexedDB
  return [];
}

async function removePendingRSVP(id) {
  // Implementation would use IndexedDB
  return true;
}

// Periodic background sync for schedule updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'schedule-update') {
    event.waitUntil(checkScheduleUpdates());
  }
});

async function checkScheduleUpdates() {
  try {
    const response = await fetch('/api/schedule/check-updates');
    const data = await response.json();
    
    if (data.hasUpdates) {
      self.registration.showNotification('📅 Schedule Updated', {
        body: data.message,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: { type: 'schedule-update' }
      });
    }
  } catch (error) {
    console.error('Error checking schedule updates:', error);
  }
}