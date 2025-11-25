'use client';

import React, { createContext, useContext, useMemo, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, User, Auth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Functions } from 'firebase/functions';
import type { Analytics } from 'firebase/analytics';
import type { Performance } from 'firebase/performance';
import { auth, firestore, functions, analytics, performance } from './index';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null; // App can be null if not initialized
  auth: Auth;
  firestore: Firestore;
  functions: Functions | null;
  analytics: Analytics | null;
  performance: Performance | null;
}

const AuthContext = createContext<{ user: User | null; isAuthLoading: boolean; } | undefined>(undefined);
const FirebaseServicesContext = createContext<Omit<FirebaseContextValue, 'user' | 'isAuthLoading'> | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const firebaseServices = useMemo(() => ({
      firebaseApp: auth.app,
      auth,
      firestore,
      functions,
      analytics,
      performance
  }), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [firebaseServices.auth]);

  const authValue = { user, isAuthLoading };
  
  return (
    <FirebaseServicesContext.Provider value={firebaseServices}>
      <AuthContext.Provider value={authValue}>
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
            <>
              {children}
              <FirebaseErrorListener />
            </>
          )}
      </AuthContext.Provider>
    </FirebaseServicesContext.Provider>
  );
}

export const useFirebase = (): Omit<FirebaseContextValue, 'user' | 'isAuthLoading'> => {
  const context = useContext(FirebaseServicesContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useUser = (): { user: User | null, isAuthLoading: boolean } => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a FirebaseProvider');
    }
    return context;
}

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useAnalytics = (): Analytics | null => useFirebase().analytics;
