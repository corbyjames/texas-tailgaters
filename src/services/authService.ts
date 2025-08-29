// Auth service using Firebase Authentication
import { auth } from '../config/firebase';
import { database } from '../config/firebase';
import { ref, set, get } from 'firebase/database';
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
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.displayName || undefined,
      role: 'member',
      isAdmin: firebaseUser.email === 'test@texastailgaters.com' || firebaseUser.email === 'corbyjames@gmail.com',
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
      this.currentUser = await this.mapFirebaseUser(result.user);
      
      // Store user metadata in Firebase Database
      const userRef = ref(database, `users/${result.user.uid}`);
      await set(userRef, {
        email: result.user.email,
        name: result.user.displayName,
        lastLogin: new Date().toISOString(),
        isAdmin: this.currentUser.isAdmin
      });
      
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
        role: 'member',
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