
'use client';

import React, { createContext, useContext, useMemo, useEffect, useState, type ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Functions } from 'firebase/functions';
import type { Analytics } from 'firebase/analytics';
import type { Performance } from 'firebase/performance';
import { initializeFirebase } from './index';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  functions: Functions;
  analytics: Analytics | null;
  performance: Performance | null;
  user: User | null;
  isAuthLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const firebaseServices = useMemo(() => initializeFirebase(), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [firebaseServices.auth]);

  const value = {
    ...firebaseServices,
    user,
    isAuthLoading,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {isAuthLoading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
        }}>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        children
      )}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = (): Omit<FirebaseContextValue, 'user' | 'isAuthLoading'> => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  const { user, isAuthLoading, ...services } = context;
  return services;
};

export const useUser = (): { user: User | null, isAuthLoading: boolean } => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a FirebaseProvider');
    }
    return { user: context.user, isAuthLoading: context.isAuthLoading };
}

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useAnalytics = (): Analytics | null => useFirebase().analytics;
