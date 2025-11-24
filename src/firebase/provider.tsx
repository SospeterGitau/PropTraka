
'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getPerformance, type Performance } from 'firebase/performance';
import { initializeFirebase } from './index';

interface FirebaseContextValue {
  auth: Auth;
  firestore: Firestore;
  functions: Functions;
  analytics: Analytics | null;
  performance: Performance | null;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

/**
 * This provider's sole responsibility is to initialize Firebase services
 * and make them available to the rest of the application via context.
 * It does NOT handle authentication state.
 */
export function FirebaseProvider({ children }: { children: ReactNode }) {
  const services = useMemo(() => initializeFirebase(), []);
  
  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = (): FirebaseContextValue => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

// These hooks are now simple wrappers around useFirebase for convenience
export const useAuth = (): Auth => {
  return useFirebase().auth;
};

export const useFirestore = (): Firestore => {
  return useFirebase().firestore;
};

export const useAnalytics = (): Analytics | null => {
  return useFirebase().analytics;
};
