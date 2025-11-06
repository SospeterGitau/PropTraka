
'use client';

/**
 * @fileoverview This file serves as the primary entry point for all Firebase-related
 * functionality in the application. It acts as a "barrel" file, re-exporting modules
 * to provide a single, consistent import path for other parts of the app.
 *
 * It is responsible for:
 * 1. Initializing the Firebase app on the client side.
 * 2. Exporting the core Firebase services (Auth, Firestore, Analytics).
 * 3. Exporting all custom hooks related to Firebase, such as `useUser`, `useCollection`,
 *    and `useDoc`.
 * 4. Exporting the main `FirebaseProvider` and `FirebaseClientProvider` components.
 *
 * By importing from `@/firebase`, other files can easily access any Firebase utility
 * without needing to know the specific file path of each individual function or hook.
 */

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  // App Check is now initialized in FirebaseClientProvider to ensure it runs client-side only.

  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    // Conditionally get analytics only on the client
    analytics: typeof window !== 'undefined' ? getAnalytics(firebaseApp) : null,
  };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';
export * from './analytics';
