// Auth service using Firebase Authentication
import { auth } from '../config/firebase';
import { database } from '../config/firebase';
import { ref, set, get, update } from 'firebase/database';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'member';
  isAdmin: boolean;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        this.currentUser = await this.mapFirebaseUser(firebaseUser);
      } else {
        this.currentUser = null;
      }
      this.notifyListeners();
    });
  }

  private async mapFirebaseUser(firebaseUser: FirebaseUser): Promise<AuthUser> {
    const adminEmails = [
      'admin@texastailgaters.com',
      'corbyjames@gmail.com',
      'test@texastailgaters.com' // Can be admin for testing
    ];
    
    const isAdmin = adminEmails.includes(firebaseUser.email?.toLowerCase() || '');
    
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.displayName || undefined,
      role: isAdmin ? 'admin' : 'member',
      isAdmin: isAdmin,
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async signIn(email: string, password: string): Promise<{ error: any }> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check user status in database
      const userRef = ref(database, `users/${result.user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        // Check if user is inactive
        if (userData.status === 'inactive') {
          await firebaseSignOut(auth);
          return { error: { message: 'Your account has been deactivated. Please contact an administrator.' } };
        }
        
        // Update last login
        await update(userRef, {
          lastLogin: new Date().toISOString()
        });
      } else {
        // First time login, create user record
        await set(userRef, {
          email: result.user.email,
          name: result.user.displayName,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          status: 'active',
          role: this.currentUser?.isAdmin ? 'admin' : 'member'
        });
      }
      
      this.currentUser = await this.mapFirebaseUser(result.user);
      this.notifyListeners();
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  }

  async signUp(email: string, password: string, name: string): Promise<{ error: any }> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      if (name) {
        await updateProfile(result.user, { displayName: name });
      }
      
      this.currentUser = await this.mapFirebaseUser(result.user);
      
      // Store user metadata in Firebase Database
      const userRef = ref(database, `users/${result.user.uid}`);
      await set(userRef, {
        email: result.user.email,
        name: name,
        createdAt: new Date().toISOString(),
        role: 'pending',
        status: 'pending_approval',
        isAdmin: false
      });
      
      this.notifyListeners();
      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      await firebaseSignOut(auth);
      this.currentUser = null;
      this.notifyListeners();
      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  async resetPassword(email: string): Promise<{ error: any }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { error };
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getSession() {
    return Promise.resolve({ 
      data: { 
        session: this.currentUser ? { user: this.currentUser } : null 
      } 
    });
  }
}

export const authService = new AuthService();
export default authService;