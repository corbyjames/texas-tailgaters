const webpush = require('web-push');
const admin = require('../config/firebase');

class NotificationService {
  constructor() {
    // Initialize web-push for PWA notifications
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:admin@texastailgaters.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
    
    // Store subscriptions (in production, use database)
    this.subscriptions = new Map();
  }

  /**
   * Save push notification subscription
   */
  async saveSubscription(userId, subscription) {
    try {
      // Store subscription for user
      this.subscriptions.set(userId, subscription);
      
      // In production, save to database
      const subscriptionRef = admin.database().ref(`pushSubscriptions/${userId}`);
      await subscriptionRef.set({
        subscription,
        createdAt: new Date().toISOString(),
        platform: this.detectPlatform(subscription)
      });
      
      console.log(`Saved push subscription for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  }

  /**
   * Detect platform from subscription
   */
  detectPlatform(subscription) {
    const endpoint = subscription.endpoint;
    if (endpoint.includes('fcm.googleapis.com')) return 'android';
    if (endpoint.includes('push.apple.com')) return 'ios';
    if (endpoint.includes('mozilla.com')) return 'firefox';
    return 'chrome';
  }

  /**
   * Send schedule update notifications
   */
  async sendScheduleUpdateNotifications(changes) {
    const payload = {
      title: '🏈 Schedule Update',
      body: this.formatScheduleChanges(changes),
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: {
        type: 'schedule-update',
        changes: changes
      }
    };
    
    await this.broadcastNotification(payload);
  }

  /**
   * Send TV network announcement notifications
   */
  async sendNetworkAnnouncementNotifications(updates) {
    for (const update of updates) {
      const payload = {
        title: '📺 TV Network Announced',
        body: `${update.opponent} game will be on ${update.tvNetwork}`,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
          type: 'network-announcement',
          gameId: update.gameId,
          opponent: update.opponent,
          network: update.tvNetwork
        }
      };
      
      await this.broadcastNotification(payload);
    }
  }

  /**
   * Send bowl game notifications
   */
  async sendBowlGameNotifications(bowlGames) {
    for (const game of bowlGames) {
      const payload = {
        title: '🏆 Bowl Game Announcement!',
        body: `Texas invited to ${game.bowlName}!`,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
          type: 'bowl-announcement',
          gameId: game.id,
          bowlName: game.bowlName,
          date: game.date
        }
      };
      
      await this.broadcastNotification(payload);
    }
  }

  /**
   * Send game event notifications (scoring plays, game end)
   */
  async sendGameEventNotification(game, event) {
    let title, body;
    
    switch (event.type) {
      case 'touchdown':
        title = '🏈 TOUCHDOWN!';
        body = `Texas scores! ${event.homeScore}-${event.awayScore}`;
        break;
      case 'field-goal':
        title = '🏈 Field Goal';
        body = `Texas kicks a field goal. ${event.homeScore}-${event.awayScore}`;
        break;
      case 'game-end':
        title = event.result === 'W' ? '🎉 Victory!' : '📊 Final Score';
        body = `${game.opponent}: ${event.homeScore}-${event.awayScore}`;
        break;
      case 'halftime':
        title = '⏸️ Halftime';
        body = `${game.opponent}: ${event.homeScore}-${event.awayScore}`;
        break;
      default:
        return;
    }
    
    const payload = {
      title,
      body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      vibrate: [100, 50, 100],
      data: {
        type: 'game-event',
        gameId: game.id,
        eventType: event.type,
        homeScore: event.homeScore,
        awayScore: event.awayScore
      }
    };
    
    await this.broadcastNotification(payload);
  }

  /**
   * Send reminder notifications
   */
  async sendGameReminder(game, hoursBeforeGame = 24) {
    const payload = {
      title: '🏈 Game Day Reminder',
      body: `${game.opponent} game ${hoursBeforeGame === 24 ? 'tomorrow' : `in ${hoursBeforeGame} hours`} at ${game.time}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'rsvp',
          title: 'RSVP'
        }
      ],
      data: {
        type: 'game-reminder',
        gameId: game.id,
        opponent: game.opponent,
        time: game.time
      }
    };
    
    await this.broadcastNotification(payload);
  }

  /**
   * Broadcast notification to all subscribed users
   */
  async broadcastNotification(payload) {
    try {
      // Get all subscriptions from database
      const subscriptionsSnapshot = await admin.database()
        .ref('pushSubscriptions')
        .once('value');
      
      const subscriptions = subscriptionsSnapshot.val() || {};
      const notifications = [];
      
      for (const [userId, data] of Object.entries(subscriptions)) {
        if (data.subscription) {
          notifications.push(
            this.sendNotification(data.subscription, payload)
              .catch(err => {
                console.error(`Failed to send to ${userId}:`, err);
                // Remove invalid subscriptions
                if (err.statusCode === 410) {
                  this.removeSubscription(userId);
                }
              })
          );
        }
      }
      
      await Promise.allSettled(notifications);
      console.log(`Sent ${notifications.length} notifications`);
      
    } catch (error) {
      console.error('Error broadcasting notifications:', error);
    }
  }

  /**
   * Send individual notification
   */
  async sendNotification(subscription, payload) {
    try {
      // For iOS Safari, format differently
      const platform = this.detectPlatform(subscription);
      
      if (platform === 'ios') {
        // iOS specific formatting
        payload = {
          ...payload,
          sound: 'default',
          mutableContent: 1,
          contentAvailable: 1
        };
      }
      
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Remove invalid subscription
   */
  async removeSubscription(userId) {
    try {
      this.subscriptions.delete(userId);
      await admin.database().ref(`pushSubscriptions/${userId}`).remove();
      console.log(`Removed invalid subscription for user ${userId}`);
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  }

  /**
   * Format schedule changes for notification
   */
  formatScheduleChanges(changes) {
    if (changes.length === 0) return 'Schedule updated';
    
    const change = changes[0];
    if (change.field === 'time') {
      return `${change.opponent} game time changed to ${change.newValue}`;
    }
    if (change.field === 'tvNetwork') {
      return `${change.opponent} game will be on ${change.newValue}`;
    }
    if (change.field === 'date') {
      return `${change.opponent} game moved to ${change.newValue}`;
    }
    
    return `${changes.length} schedule changes`;
  }

  /**
   * Schedule reminder notifications
   */
  scheduleGameReminders(game) {
    const gameDate = new Date(`${game.date} ${game.time}`);
    
    // 24 hours before
    const dayBefore = new Date(gameDate.getTime() - 24 * 60 * 60 * 1000);
    if (dayBefore > new Date()) {
      setTimeout(() => {
        this.sendGameReminder(game, 24);
      }, dayBefore.getTime() - Date.now());
    }
    
    // 3 hours before
    const threeHoursBefore = new Date(gameDate.getTime() - 3 * 60 * 60 * 1000);
    if (threeHoursBefore > new Date()) {
      setTimeout(() => {
        this.sendGameReminder(game, 3);
      }, threeHoursBefore.getTime() - Date.now());
    }
  }
}

module.exports = new NotificationService();