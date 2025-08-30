import { database } from '../config/firebase';
import { ref, push, set, get, orderByChild, query, limitToLast } from 'firebase/database';

export interface Feedback {
  id?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  category: 'ui' | 'functionality' | 'performance' | 'content' | 'other';
  priority: 'low' | 'medium' | 'high';
  subject: string;
  message: string;
  status: 'new' | 'reviewed' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    screenSize: string;
  };
  appVersion?: string;
  attachments?: string[];
}

class FeedbackService {
  private feedbackRef = ref(database, 'feedback');

  /**
   * Submit new feedback
   */
  async submitFeedback(feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const newFeedbackRef = push(this.feedbackRef);
      const feedbackData: Feedback = {
        ...feedback,
        status: 'new',
        createdAt: new Date().toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenSize: `${window.innerWidth}x${window.innerHeight}`
        },
        appVersion: '1.0.0' // You can get this from package.json or env variable
      };

      await set(newFeedbackRef, feedbackData);
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('feedbackSubmitted', { 
        detail: { id: newFeedbackRef.key, ...feedbackData } 
      }));

      return newFeedbackRef.key || '';
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get all feedback (admin only)
   */
  async getAllFeedback(): Promise<Feedback[]> {
    try {
      const snapshot = await get(this.feedbackRef);
      if (!snapshot.exists()) return [];

      const feedback: Feedback[] = [];
      snapshot.forEach((child) => {
        feedback.push({
          id: child.key || '',
          ...child.val()
        });
      });

      // Sort by creation date (newest first)
      return feedback.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  }

  /**
   * Get recent feedback
   */
  async getRecentFeedback(limit: number = 10): Promise<Feedback[]> {
    try {
      const recentQuery = query(
        this.feedbackRef,
        orderByChild('createdAt'),
        limitToLast(limit)
      );
      
      const snapshot = await get(recentQuery);
      if (!snapshot.exists()) return [];

      const feedback: Feedback[] = [];
      snapshot.forEach((child) => {
        feedback.push({
          id: child.key || '',
          ...child.val()
        });
      });

      return feedback.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching recent feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback by status
   */
  async getFeedbackByStatus(status: Feedback['status']): Promise<Feedback[]> {
    try {
      const statusQuery = query(
        this.feedbackRef,
        orderByChild('status')
      );
      
      const snapshot = await get(statusQuery);
      if (!snapshot.exists()) return [];

      const feedback: Feedback[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        if (data.status === status) {
          feedback.push({
            id: child.key || '',
            ...data
          });
        }
      });

      return feedback.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching feedback by status:', error);
      throw error;
    }
  }

  /**
   * Update feedback status (admin only)
   */
  async updateFeedbackStatus(
    feedbackId: string, 
    status: Feedback['status'], 
    adminNotes?: string
  ): Promise<void> {
    try {
      const feedbackItemRef = ref(database, `feedback/${feedbackId}`);
      const updates: Partial<Feedback> = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (adminNotes) {
        updates.adminNotes = adminNotes;
      }

      await set(feedbackItemRef, updates);
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('feedbackUpdated', { 
        detail: { id: feedbackId, ...updates } 
      }));
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw error;
    }
  }

  /**
   * Get feedback stats for admin dashboard
   */
  async getFeedbackStats(): Promise<{
    total: number;
    byStatus: Record<Feedback['status'], number>;
    byType: Record<Feedback['type'], number>;
    byPriority: Record<Feedback['priority'], number>;
    recentCount: number;
  }> {
    try {
      const allFeedback = await this.getAllFeedback();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const stats = {
        total: allFeedback.length,
        byStatus: {
          new: 0,
          reviewed: 0,
          'in-progress': 0,
          resolved: 0,
          closed: 0
        },
        byType: {
          bug: 0,
          feature: 0,
          improvement: 0,
          other: 0
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0
        },
        recentCount: 0
      };

      allFeedback.forEach(item => {
        // Count by status
        stats.byStatus[item.status]++;
        
        // Count by type
        stats.byType[item.type]++;
        
        // Count by priority
        stats.byPriority[item.priority]++;
        
        // Count recent (last 7 days)
        if (new Date(item.createdAt) > oneWeekAgo) {
          stats.recentCount++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error calculating feedback stats:', error);
      throw error;
    }
  }
}

export default new FeedbackService();