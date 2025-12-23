'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './index';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('[useUser] Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        console.log('[useUser] Auth state changed:', currentUser ? `User: ${currentUser.uid} (${currentUser.email})` : 'No user');
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('❌ [useUser] Auth error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      console.log('[useUser] Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  return { user, loading, error };
}

export { auth };
