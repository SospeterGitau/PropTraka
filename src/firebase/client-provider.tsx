
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';

interface FirebaseClientContextValue {
  user: User | null;
  isAuthLoading: boolean;
}

const FirebaseClientContext = createContext<FirebaseClientContextValue | undefined>(undefined);

/**
 * This is the primary client-side provider. It handles Firebase initialization
 * and authentication state, providing them to the rest of the application.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Initialize Firebase services once.
  const firebaseServices = React.useMemo(() => initializeFirebase(), []);

  useEffect(() => {
    // onAuthStateChanged listener handles user session changes.
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [firebaseServices.auth]);

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
      <FirebaseProvider {...firebaseServices}>
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
