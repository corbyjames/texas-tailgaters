import { ref, get, set, onValue } from 'firebase/database';
import { database } from '../config/firebase';

export interface Headline {
  id?: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  expiresAt?: string;
}

class HeadlineService {
  private headlineRef = ref(database, 'headline');

  /**
   * Get the current active headline
   */
  async getActiveHeadline(): Promise<Headline | null> {
    try {
      const snapshot = await get(this.headlineRef);
      if (snapshot.exists()) {
        const headline = snapshot.val() as Headline;

        // Check if headline is active and not expired
        if (headline.isActive) {
          if (headline.expiresAt) {
            const expiryDate = new Date(headline.expiresAt);
            if (expiryDate < new Date()) {
              // Headline has expired, deactivate it
              await this.updateHeadline({ ...headline, isActive: false });
              return null;
            }
          }
          return headline;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching headline:', error);
      return null;
    }
  }

  /**
   * Update or create headline
   */
  async updateHeadline(headline: Partial<Headline>): Promise<void> {
    try {
      const currentHeadline = await this.getActiveHeadline();

      const updatedHeadline: Headline = {
        id: 'main-headline',
        text: headline.text || currentHeadline?.text || '',
        type: headline.type || currentHeadline?.type || 'info',
        isActive: headline.isActive !== undefined ? headline.isActive : (currentHeadline?.isActive || false),
        createdAt: currentHeadline?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: headline.createdBy || currentHeadline?.createdBy,
        expiresAt: headline.expiresAt || currentHeadline?.expiresAt
      };

      await set(this.headlineRef, updatedHeadline);
    } catch (error) {
      console.error('Error updating headline:', error);
      throw error;
    }
  }

  /**
   * Clear headline
   */
  async clearHeadline(): Promise<void> {
    try {
      await this.updateHeadline({ isActive: false });
    } catch (error) {
      console.error('Error clearing headline:', error);
      throw error;
    }
  }

  /**
   * Subscribe to headline changes
   */
  subscribeToHeadline(callback: (headline: Headline | null) => void): () => void {
    const unsubscribe = onValue(this.headlineRef, async (snapshot) => {
      if (snapshot.exists()) {
        const headline = snapshot.val() as Headline;

        // Check if headline is active and not expired
        if (headline.isActive) {
          if (headline.expiresAt) {
            const expiryDate = new Date(headline.expiresAt);
            if (expiryDate < new Date()) {
              callback(null);
              return;
            }
          }
          callback(headline);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }
}

export default new HeadlineService();