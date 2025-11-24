
'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Functions } from 'firebase/functions';
import type { Analytics } from 'firebase/analytics';
import type { Performance } from 'firebase/performance';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  functions: Functions;
  analytics: Analytics | null;
  performance: Performance | null;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

/**
 * This provider receives the initialized Firebase services as props
 * and makes them available to its children via context.
 */
export function FirebaseProvider({ children, ...services }: { children: ReactNode } & FirebaseContextValue) {
  // The services are passed as props, so we just provide them to the context.
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
