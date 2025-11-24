
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { FirebaseProvider } from './provider';

interface FirebaseClientContextValue {
  user: User | null;
  isAuthLoading: boolean;
}

const FirebaseClientContext = createContext<FirebaseClientContextValue | undefined>(undefined);

/**
 * This is the primary client-side provider. It wraps the core FirebaseProvider
 * and adds the authentication state listener. It is responsible for showing the
 * main loading state and providing the user's auth status to the app.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

  useEffect(() => {
    // We only need to get the auth instance once.
    if (!authInstance) {
      const auth = getAuth();
      setAuthInstance(auth);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setIsAuthLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    }
  }, [authInstance]);

  if (isAuthLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'hsl(var(--background))',
      }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <FirebaseClientContext.Provider value={{ user, isAuthLoading }}>
      <FirebaseProvider>
        {children}
      </FirebaseProvider>
    </FirebaseClientContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(FirebaseClientContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseClientProvider');
  }
  return context;
};
