/**
 * Push Notification Service
 * Handles PWA push notifications for iOS and other platforms
 */

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private vapidPublicKey: string;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private backendUrl: string;

  constructor() {
    // VAPID public key for push notifications
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.log('Service Workers not supported');
        return false;
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.log('Push notifications not supported');
        return false;
      }

      // Register service worker
      await this.registerServiceWorker();

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Subscribe to push notifications
      await this.subscribeToPush();

      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.serviceWorkerRegistration = registration;
      
      console.log('Service Worker registered:', registration);

      // Update service worker if needed
      registration.update();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      // For iOS 16.4+ and Safari
      if ('Notification' in window && 'requestPermission' in Notification) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        return permission;
      }
      
      return 'denied';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPush(): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration) {
        throw new Error('Service Worker not registered');
      }

      // Check if already subscribed
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const convertedVapidKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
        
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // Save subscription to backend
      await this.saveSubscription(subscription);
      
      this.subscription = subscription.toJSON() as PushSubscription;
      console.log('Push subscription successful:', this.subscription);
      
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  }

  /**
   * Save subscription to backend
   */
  private async saveSubscription(subscription: PushSubscriptionJSON): Promise<void> {
    try {
      const userId = this.getUserId(); // Get from auth service
      
      const response = await fetch(`${this.backendUrl}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          subscription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      console.log('Subscription saved to backend');
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        return false;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    if (!('Notification' in window)) {
      return false;
    }
    
    return Notification.permission === 'granted';
  }

  /**
   * Check iOS support
   */
  isIOSSupported(): boolean {
    // iOS 16.4+ supports push notifications in PWAs
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!isIOS) return true; // Not iOS, so supported
    
    // Check iOS version
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    if (match) {
      const majorVersion = parseInt(match[1]);
      const minorVersion = parseInt(match[2]);
      
      // iOS 16.4+ supports push notifications
      return majorVersion > 16 || (majorVersion === 16 && minorVersion >= 4);
    }
    
    return false;
  }

  /**
   * Show local notification (fallback)
   */
  async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    try {
      if (!this.isEnabled()) {
        console.log('Notifications not enabled');
        return;
      }

      // Show notification
      const notification = new Notification(title, {
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Schedule notification (for game reminders)
   */
  scheduleNotification(title: string, body: string, scheduledTime: Date): void {
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();
    
    if (delay > 0) {
      setTimeout(() => {
        this.showLocalNotification(title, { body });
      }, delay);
    }
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Get user ID from auth
   */
  private getUserId(): string {
    // This should be implemented to get the actual user ID from auth service
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.id || userData.uid || 'anonymous';
    }
    return 'anonymous';
  }

  /**
   * Test notification
   */
  async testNotification(): Promise<void> {
    await this.showLocalNotification(
      '🏈 Texas Tailgaters Test',
      {
        body: 'Push notifications are working!',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      }
    );
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export type
export type { PushSubscription };