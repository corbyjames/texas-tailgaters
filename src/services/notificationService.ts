import { emailService } from './emailService';
import { User } from '../types/User';
import { Game } from '../types/Game';
import { PotluckItem } from '../types/PotluckItem';

// Notification event types
export enum NotificationEvent {
  NEW_USER_REGISTRATION = 'new_user_registration',
  USER_APPROVED = 'user_approved',
  USER_ROLE_CHANGED = 'user_role_changed',
  NEW_GAME_ADDED = 'new_game_added',
  GAME_UPDATED = 'game_updated',
  GAME_CANCELLED = 'game_cancelled',
  POTLUCK_ITEM_ASSIGNED = 'potluck_item_assigned',
  POTLUCK_REMINDER = 'potluck_reminder',
  RSVP_RECEIVED = 'rsvp_received',
  GAME_REMINDER = 'game_reminder',
  NO_TAILGATE_SET = 'no_tailgate_set'
}

// Notification recipient types
export interface NotificationRecipient {
  email: string;
  name: string;
  role?: string;
}

// Base notification data
interface BaseNotificationData {
  event: NotificationEvent;
  timestamp: Date;
  triggeredBy?: string;
}

// Specific notification data types
export interface NewUserNotificationData extends BaseNotificationData {
  event: NotificationEvent.NEW_USER_REGISTRATION;
  user: {
    id: string;
    email: string;
    name: string;
    registeredAt: string;
  };
}

export interface UserApprovedNotificationData extends BaseNotificationData {
  event: NotificationEvent.USER_APPROVED;
  user: {
    email: string;
    name: string;
  };
}

export interface GameNotificationData extends BaseNotificationData {
  event: NotificationEvent.NEW_GAME_ADDED | NotificationEvent.GAME_UPDATED | NotificationEvent.GAME_CANCELLED | NotificationEvent.NO_TAILGATE_SET;
  game: {
    id: string;
    opponent: string;
    date: string;
    time: string;
    location: string;
    isHome: boolean;
    noTailgate?: boolean;
  };
  changes?: string[];
}

export interface PotluckNotificationData extends BaseNotificationData {
  event: NotificationEvent.POTLUCK_ITEM_ASSIGNED | NotificationEvent.POTLUCK_REMINDER;
  item: {
    name: string;
    category: string;
    quantity: string;
    gameId: string;
  };
  assignee: {
    email: string;
    name: string;
  };
}

export interface RSVPNotificationData extends BaseNotificationData {
  event: NotificationEvent.RSVP_RECEIVED;
  rsvp: {
    gameId: string;
    userEmail: string;
    userName: string;
    status: 'attending' | 'not_attending' | 'maybe';
    guestCount?: number;
  };
}

type NotificationData = 
  | NewUserNotificationData 
  | UserApprovedNotificationData 
  | GameNotificationData 
  | PotluckNotificationData 
  | RSVPNotificationData;

// Notification preferences stored in Firebase
export interface NotificationPreferences {
  userId: string;
  email: string;
  enabledEvents: NotificationEvent[];
  emailNotifications: boolean;
  smsNotifications: boolean;
  adminAlerts: boolean; // Receive admin-specific notifications
  digestFrequency?: 'immediate' | 'daily' | 'weekly';
}

class NotificationService {
  private adminEmails: string[] = [];
  private notificationQueue: NotificationData[] = [];
  private processing = false;

  constructor() {
    // Initialize with default admin emails
    // These should be loaded from Firebase in production
    this.adminEmails = [
      'texastailgaters@gmail.com',
      'admin@texastailgaters.com'
    ];
  }

  // Set admin emails for notifications
  setAdminEmails(emails: string[]): void {
    this.adminEmails = emails;
  }

  // Get admin emails from Firebase users with admin role
  async loadAdminEmails(): Promise<void> {
    try {
      // This would fetch from Firebase
      // For now, using hardcoded values
      console.log('Loading admin emails from database...');
    } catch (error) {
      console.error('Failed to load admin emails:', error);
    }
  }

  // Send notification for new user registration
  async notifyNewUserRegistration(user: Partial<User>): Promise<void> {
    const notification: NewUserNotificationData = {
      event: NotificationEvent.NEW_USER_REGISTRATION,
      timestamp: new Date(),
      user: {
        id: user.id || '',
        email: user.email || '',
        name: user.name || '',
        registeredAt: user.createdAt || new Date().toISOString()
      }
    };

    // Queue notification
    this.notificationQueue.push(notification);
    
    // Process immediately for new user registrations
    await this.processNotificationQueue();
  }

  // Send notification when user is approved
  async notifyUserApproved(user: Partial<User>): Promise<void> {
    const notification: UserApprovedNotificationData = {
      event: NotificationEvent.USER_APPROVED,
      timestamp: new Date(),
      user: {
        email: user.email || '',
        name: user.name || ''
      }
    };

    // Send welcome email to the approved user
    const emailData = {
      to_email: user.email || '',
      to_name: user.name || '',
      subject: 'Welcome to Texas Tailgaters!',
      message: `Your account has been approved! You can now access all features of the Texas Tailgaters app.`,
      app_link: 'https://texastailgaters.com/login'
    };

    await this.sendEmail(emailData);
  }

  // Send notification for game updates
  async notifyGameUpdate(game: Partial<Game>, eventType: NotificationEvent, changes?: string[]): Promise<void> {
    const notification: GameNotificationData = {
      event: eventType as any,
      timestamp: new Date(),
      game: {
        id: game.id || '',
        opponent: game.opponent || '',
        date: game.date || '',
        time: game.time || '',
        location: game.location || '',
        isHome: game.isHome || false,
        noTailgate: game.noTailgate
      },
      changes
    };

    this.notificationQueue.push(notification);
    await this.processNotificationQueue();
  }

  // Send notification for RSVP
  async notifyRSVP(rsvp: RSVPNotificationData['rsvp']): Promise<void> {
    const notification: RSVPNotificationData = {
      event: NotificationEvent.RSVP_RECEIVED,
      timestamp: new Date(),
      rsvp
    };

    this.notificationQueue.push(notification);
    await this.processNotificationQueue();
  }

  // Process the notification queue
  private async processNotificationQueue(): Promise<void> {
    if (this.processing || this.notificationQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        if (notification) {
          await this.handleNotification(notification);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  // Handle individual notifications
  private async handleNotification(notification: NotificationData): Promise<void> {
    switch (notification.event) {
      case NotificationEvent.NEW_USER_REGISTRATION:
        await this.sendNewUserAlert(notification as NewUserNotificationData);
        break;
      
      case NotificationEvent.USER_APPROVED:
        await this.sendUserApprovedEmail(notification as UserApprovedNotificationData);
        break;
      
      case NotificationEvent.NEW_GAME_ADDED:
      case NotificationEvent.GAME_UPDATED:
      case NotificationEvent.GAME_CANCELLED:
      case NotificationEvent.NO_TAILGATE_SET:
        await this.sendGameNotification(notification as GameNotificationData);
        break;
      
      case NotificationEvent.RSVP_RECEIVED:
        await this.sendRSVPNotification(notification as RSVPNotificationData);
        break;
      
      default:
        console.log('Unhandled notification type:', notification.event);
    }
  }

  // Send new user alert to admins
  private async sendNewUserAlert(data: NewUserNotificationData): Promise<void> {
    const emailData = {
      subject: '🆕 New User Registration - Texas Tailgaters',
      message: `
        <h2>New User Registration</h2>
        <p>A new user has registered and needs approval:</p>
        <ul>
          <li><strong>Name:</strong> ${data.user.name}</li>
          <li><strong>Email:</strong> ${data.user.email}</li>
          <li><strong>Registered:</strong> ${new Date(data.user.registeredAt).toLocaleString()}</li>
        </ul>
        <p>Please log in to the admin panel to review and approve this user.</p>
        <p><a href="https://texastailgaters.com/admin" style="background: #BF5700; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Admin Panel</a></p>
      `,
      isHtml: true
    };

    // Send to all admin emails
    for (const adminEmail of this.adminEmails) {
      await this.sendEmail({
        ...emailData,
        to_email: adminEmail,
        to_name: 'Admin'
      });
    }

    console.log(`New user alert sent to ${this.adminEmails.length} admins`);
  }

  // Send user approved email
  private async sendUserApprovedEmail(data: UserApprovedNotificationData): Promise<void> {
    const emailData = {
      to_email: data.user.email,
      to_name: data.user.name,
      subject: '✅ Welcome to Texas Tailgaters!',
      message: `
        <h2>Your Account Has Been Approved!</h2>
        <p>Hi ${data.user.name},</p>
        <p>Great news! Your Texas Tailgaters account has been approved by an administrator.</p>
        <p>You can now:</p>
        <ul>
          <li>View all upcoming games and tailgate information</li>
          <li>Sign up for potluck items</li>
          <li>RSVP for games</li>
          <li>Connect with other tailgaters</li>
        </ul>
        <p><a href="https://texastailgaters.com/login" style="background: #BF5700; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Log In Now</a></p>
        <p>Hook 'em Horns! 🤘</p>
      `,
      isHtml: true
    };

    await this.sendEmail(emailData);
  }

  // Send game notification
  private async sendGameNotification(data: GameNotificationData): Promise<void> {
    let subject = '';
    let message = '';

    switch (data.event) {
      case NotificationEvent.NEW_GAME_ADDED:
        subject = `🏈 New Game Added: Texas vs ${data.game.opponent}`;
        message = `A new game has been added to the schedule`;
        break;
      case NotificationEvent.GAME_UPDATED:
        subject = `📝 Game Updated: Texas vs ${data.game.opponent}`;
        message = `Game details have been updated`;
        if (data.changes && data.changes.length > 0) {
          message += `\nChanges: ${data.changes.join(', ')}`;
        }
        break;
      case NotificationEvent.GAME_CANCELLED:
        subject = `❌ Game Cancelled: Texas vs ${data.game.opponent}`;
        message = `This game has been cancelled`;
        break;
      case NotificationEvent.NO_TAILGATE_SET:
        subject = `🚫 No Tailgate: Texas vs ${data.game.opponent}`;
        message = `This game will not have a tailgate event`;
        break;
    }

    // For now, log to console
    console.log('Game notification:', { subject, message, game: data.game });
    
    // In production, this would send emails to subscribed users
  }

  // Send RSVP notification to admins
  private async sendRSVPNotification(data: RSVPNotificationData): Promise<void> {
    const statusEmoji = {
      attending: '✅',
      not_attending: '❌',
      maybe: '🤔'
    };

    const emailData = {
      subject: `${statusEmoji[data.rsvp.status]} RSVP Received: ${data.rsvp.userName}`,
      message: `
        <h3>New RSVP</h3>
        <p><strong>${data.rsvp.userName}</strong> has responded:</p>
        <p>Status: <strong>${data.rsvp.status.replace('_', ' ').toUpperCase()}</strong></p>
        ${data.rsvp.guestCount ? `<p>Guests: ${data.rsvp.guestCount}</p>` : ''}
      `,
      isHtml: true
    };

    // Log for now
    console.log('RSVP notification:', emailData);
  }

  // Generic email sender using EmailJS
  private async sendEmail(data: any): Promise<void> {
    try {
      // Check if EmailJS is configured
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_NOTIFICATION_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        console.log('EmailJS not configured. Notification would be sent to:', data.to_email);
        console.log('Subject:', data.subject);
        console.log('Message:', data.message);
        return;
      }

      // Use emailService if available
      // For now, just log the notification
      console.log('Sending notification email:', {
        to: data.to_email,
        subject: data.subject,
        preview: data.message?.substring(0, 100) + '...'
      });

    } catch (error) {
      console.error('Failed to send notification email:', error);
    }
  }

  // Get notification history (would be stored in Firebase)
  async getNotificationHistory(limit: number = 50): Promise<NotificationData[]> {
    // This would fetch from Firebase
    return [];
  }

  // Test notification system
  async testNotification(type: NotificationEvent): Promise<void> {
    console.log(`Testing notification: ${type}`);
    
    switch (type) {
      case NotificationEvent.NEW_USER_REGISTRATION:
        await this.notifyNewUserRegistration({
          id: 'test-user-123',
          email: 'testuser@example.com',
          name: 'Test User',
          createdAt: new Date().toISOString()
        });
        break;
      
      default:
        console.log(`Test not implemented for ${type}`);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types
export type { 
  NotificationRecipient, 
  NotificationPreferences,
  NotificationData
};