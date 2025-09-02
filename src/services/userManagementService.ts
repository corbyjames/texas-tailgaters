import { database, auth } from '../config/firebase';
import { ref, get, set, update, remove, onValue } from 'firebase/database';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'member' | 'pending';
  status: 'active' | 'inactive' | 'pending_approval';
  createdAt: string;
  lastLogin?: string;
  approvedAt?: string;
  approvedBy?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  metadata?: {
    phoneNumber?: string;
    notes?: string;
  };
}

class UserManagementService {
  async getAllUsers(): Promise<User[]> {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      return Object.keys(usersData).map(key => ({
        id: key,
        ...usersData[key],
        role: usersData[key].role || 'member',
        status: usersData[key].status || 'active'
      }));
    }
    return [];
  }

  async getUserById(userId: string): Promise<User | null> {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return {
        id: userId,
        ...snapshot.val()
      };
    }
    return null;
  }

  async approveUser(userId: string, approvedBy: string): Promise<boolean> {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        status: 'active',
        role: 'member',
        approvedAt: new Date().toISOString(),
        approvedBy: approvedBy
      });
      return true;
    } catch (error) {
      console.error('Error approving user:', error);
      return false;
    }
  }

  async deactivateUser(userId: string, deactivatedBy: string): Promise<boolean> {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        status: 'inactive',
        deactivatedAt: new Date().toISOString(),
        deactivatedBy: deactivatedBy
      });
      return true;
    } catch (error) {
      console.error('Error deactivating user:', error);
      return false;
    }
  }

  async reactivateUser(userId: string): Promise<boolean> {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        status: 'active',
        deactivatedAt: null,
        deactivatedBy: null
      });
      return true;
    } catch (error) {
      console.error('Error reactivating user:', error);
      return false;
    }
  }

  async updateUserRole(userId: string, role: 'admin' | 'member'): Promise<boolean> {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        role: role,
        isAdmin: role === 'admin'
      });
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  async sendPasswordReset(email: string): Promise<boolean> {
    try {
      await sendPasswordResetEmail(auth, email);
      
      // Log the password reset action
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const userId = Object.keys(usersData).find(key => 
          usersData[key].email === email
        );
        
        if (userId) {
          const userRef = ref(database, `users/${userId}`);
          await update(userRef, {
            lastPasswordReset: new Date().toISOString()
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error sending password reset:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      // First, remove from database
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);
      
      // Note: Deleting from Firebase Auth requires the user to be currently signed in
      // or administrative privileges that aren't available in client-side code
      // This would typically be done through a Cloud Function
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async updateUserMetadata(userId: string, metadata: any): Promise<boolean> {
    try {
      const userRef = ref(database, `users/${userId}/metadata`);
      await update(userRef, metadata);
      return true;
    } catch (error) {
      console.error('Error updating user metadata:', error);
      return false;
    }
  }

  // Real-time listener for user updates
  onUsersChange(callback: (users: User[]) => void): () => void {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const users = Object.keys(usersData).map(key => ({
          id: key,
          ...usersData[key],
          role: usersData[key].role || 'member',
          status: usersData[key].status || 'active'
        }));
        callback(users);
      } else {
        callback([]);
      }
    });
    
    return unsubscribe;
  }

  // Get user statistics
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
    admins: number;
  }> {
    const users = await this.getAllUsers();
    
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      pending: users.filter(u => u.status === 'pending_approval').length,
      admins: users.filter(u => u.role === 'admin').length
    };
  }
}

export const userManagementService = new UserManagementService();
export default userManagementService;