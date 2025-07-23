import { useState, useEffect } from 'react';
import { authService, User, AuthState } from '@/lib/auth-local';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((newAuthState) => {
      setAuthState(newAuthState);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user: authState.user,
    loading,
    isAuthenticated: authState.isAuthenticated,
  };
}
