/**
 * @fileoverview This file serves as the primary entry point for all Firebase-related
 * functionality in the application. It acts as a "barrel" file, re-exporting modules
 * to provide a single, consistent import path for other parts of the app.
 *
 * It is responsible for:
 * 1. Initializing the Firebase app on the client side.
 * 2. Exporting the core Firebase services (Auth, Firestore, Analytics).
 * 3. Exporting all custom hooks related to Firebase, such as `useUser`,
 *    and `useDoc`.
 * 4. Exporting the main `FirebaseProvider` and `FirebaseClientProvider` components.
 *
 * By importing from `@/firebase`, other files can easily access any Firebase utility
 * without needing to know the specific file path of each individual function or hook.
 */

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This function ensures a single instance of the Firebase app is created.
const getFirebaseApp = (): FirebaseApp => {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
};

const app = getFirebaseApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Export the initialized services
export { app, auth, firestore, analytics };


export function initializeFirebase() {
  const appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  return getSdks(appInstance);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    analytics: typeof window !== 'undefined' ? getAnalytics(firebaseApp) : null,
  };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export * from './analytics';
