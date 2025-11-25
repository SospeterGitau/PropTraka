
/**
 * @fileoverview This file serves as the primary entry point for all Firebase-related
 * functionality in the application. It acts as a "barrel" file, re-exporting modules
 * to provide a single, consistent import path for other parts of the app.
 *
 * It is responsible for:
 * 1. Initializing the Firebase app on the client side.
 * 2. Exporting the core Firebase services (Auth, Firestore, Analytics).
 * 3. Exporting all custom hooks related to Firebase, such as `useUser`.
 * 4. Exporting the main `FirebaseProvider`.
 *
 * By importing from `@/firebase`, other files can easily access any Firebase utility
 * without needing to know the specific file path of each individual function or hook.
 */

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// import { getAnalytics, Analytics } from 'firebase/analytics'; // Temporarily disabled
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getPerformance, Performance } from 'firebase/performance';

// This function ensures a single instance of the Firebase app is created.
const getFirebaseApp = (): FirebaseApp => {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
};

export function initializeFirebase() {
  const appInstance = getFirebaseApp();
  
  return {
    firebaseApp: appInstance,
    auth: getAuth(appInstance),
    firestore: getFirestore(appInstance),
    functions: getFunctions(appInstance),
    // Analytics is temporarily disabled to prevent initialization loop
    analytics: null,
    performance: typeof window !== 'undefined' ? getPerformance(appInstance) : null,
  };
}


export * from './provider';
export * from './errors';
export * from './error-emitter';
export * from './analytics';
