
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getPerformance, Performance } from 'firebase/performance';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { initializeFirebase } from './index';

interface FirebaseContextValue {
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
  const [isAppCheckReady, setIsAppCheckReady] = useState(false);

  const services = useMemo(() => initializeFirebase(), []);
  const { auth, firestore, functions, analytics, performance, firebaseApp } = services;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);
  
  useEffect(() => {
    if (firebaseApp) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        }
        initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaV3Provider('6Lce_OYpAAAAAPc-PE2P23B2x7-SA5i1u2n-B1bI'),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (error) {
        console.warn('App Check initialization failed (non-critical):', error);
      } finally {
        setIsAppCheckReady(true);
      }
    }
  }, [firebaseApp]);

  if (isAuthLoading || !isAppCheckReady) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
      }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ auth, firestore, functions, analytics, performance, user, isAuthLoading }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useUser = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider');
  }
  return { user: context.user, isAuthLoading: context.isAuthLoading };
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useAnalytics = () => {
  const { analytics } = useFirebase();
  return analytics;
};
