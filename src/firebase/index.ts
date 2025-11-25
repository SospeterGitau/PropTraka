
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { firebaseConfig } from './config';
import { getFunctions, Functions } from 'firebase/functions';
import { getPerformance, Performance } from 'firebase/performance';
import type { Analytics } from 'firebase/analytics';


// Initialize Firebase (only once)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export auth and firestore
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);
export const performance: Performance | null = typeof window !== 'undefined' ? getPerformance(app) : null;
export const analytics: Analytics | null = null; // Analytics is temporarily disabled

// useUser hook for authentication state
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isAuthLoading };
}

export * from './provider';
export * from './errors';
export * from './error-emitter';
export * from './analytics';
