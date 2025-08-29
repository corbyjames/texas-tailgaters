import { useState, useEffect } from 'react';
import authService, { AuthUser } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user state
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Listen for auth changes
    const unsubscribe = authService.onAuthStateChange((authUser) => {
      console.log('Auth state changed:', authUser);
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return authService.signIn(email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    return authService.signUp(email, password, name);
  };

  const signOut = async () => {
    return authService.signOut();
  };

  const resetPassword = async (email: string) => {
    return authService.resetPassword(email);
  };

  return {
    user,
    session: user ? { user } : null,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}