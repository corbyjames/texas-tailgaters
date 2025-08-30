import { database } from '../config/firebase';
import { ref, push, set, get, update, remove } from 'firebase/database';

export interface RSVP {
  id?: string;
  gameId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  status: 'yes' | 'no' | 'maybe';
  attendeeCount: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

class RSVPService {
  private rsvpRef = ref(database, 'rsvps');

  /**
   * Create or update RSVP for a game
   */
  async submitRSVP(rsvp: Omit<RSVP, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Check if user already has RSVP for this game
      const existingRSVP = await this.getUserRSVPForGame(rsvp.userId, rsvp.gameId);
      
      if (existingRSVP) {
        // Update existing RSVP
        const rsvpItemRef = ref(database, `rsvps/${existingRSVP.id}`);
        await update(rsvpItemRef, {
          ...rsvp,
          updatedAt: new Date().toISOString()
        });
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('rsvpUpdated', { 
          detail: { gameId: rsvp.gameId, rsvp: { ...existingRSVP, ...rsvp } } 
        }));
        
        return existingRSVP.id!;
      } else {
        // Create new RSVP
        const newRSVPRef = push(this.rsvpRef);
        const rsvpData: RSVP = {
          ...rsvp,
          createdAt: new Date().toISOString()
        };
        
        await set(newRSVPRef, rsvpData);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('rsvpCreated', { 
          detail: { gameId: rsvp.gameId, rsvp: { id: newRSVPRef.key, ...rsvpData } } 
        }));
        
        return newRSVPRef.key || '';
      }
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      throw error;
    }
  }

  /**
   * Get user's RSVP for a specific game
   */
  async getUserRSVPForGame(userId: string, gameId: string): Promise<RSVP | null> {
    try {
      const snapshot = await get(this.rsvpRef);
      if (!snapshot.exists()) return null;

      let userRSVP: RSVP | null = null;
      snapshot.forEach((child) => {
        const data = child.val();
        if (data.userId === userId && data.gameId === gameId) {
          userRSVP = {
            id: child.key || '',
            ...data
          };
        }
      });

      return userRSVP;
    } catch (error) {
      console.error('Error fetching user RSVP:', error);
      return null;
    }
  }

  /**
   * Get all RSVPs for a game
   */
  async getGameRSVPs(gameId: string): Promise<RSVP[]> {
    try {
      const snapshot = await get(this.rsvpRef);
      if (!snapshot.exists()) return [];

      const rsvps: RSVP[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        if (data.gameId === gameId) {
          rsvps.push({
            id: child.key || '',
            ...data
          });
        }
      });

      return rsvps.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching game RSVPs:', error);
      return [];
    }
  }

  /**
   * Get RSVP stats for a game
   */
  async getGameRSVPStats(gameId: string): Promise<{
    total: number;
    yes: number;
    no: number;
    maybe: number;
    totalAttendees: number;
  }> {
    try {
      const rsvps = await this.getGameRSVPs(gameId);
      
      const stats = {
        total: rsvps.length,
        yes: 0,
        no: 0,
        maybe: 0,
        totalAttendees: 0
      };

      rsvps.forEach(rsvp => {
        stats[rsvp.status]++;
        if (rsvp.status === 'yes') {
          stats.totalAttendees += rsvp.attendeeCount;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error calculating RSVP stats:', error);
      return {
        total: 0,
        yes: 0,
        no: 0,
        maybe: 0,
        totalAttendees: 0
      };
    }
  }

  /**
   * Get all user's RSVPs
   */
  async getUserRSVPs(userId: string): Promise<RSVP[]> {
    try {
      const snapshot = await get(this.rsvpRef);
      if (!snapshot.exists()) return [];

      const rsvps: RSVP[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        if (data.userId === userId) {
          rsvps.push({
            id: child.key || '',
            ...data
          });
        }
      });

      return rsvps.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching user RSVPs:', error);
      return [];
    }
  }

  /**
   * Cancel RSVP
   */
  async cancelRSVP(rsvpId: string): Promise<void> {
    try {
      const rsvpItemRef = ref(database, `rsvps/${rsvpId}`);
      await remove(rsvpItemRef);
      
      window.dispatchEvent(new CustomEvent('rsvpCancelled', { 
        detail: { rsvpId } 
      }));
    } catch (error) {
      console.error('Error cancelling RSVP:', error);
      throw error;
    }
  }
}

export default new RSVPService();