
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

let authInstance: Auth;
let firestoreInstance: Firestore;
let functionsInstance: Functions;
let analyticsInstance: Analytics | null;
let performanceInstance: Performance | null;


function initializeFirebaseServices() {
  const appInstance = getFirebaseApp();
  authInstance = getAuth(appInstance);
  firestoreInstance = getFirestore(appInstance);
  functionsInstance = getFunctions(appInstance);
  analyticsInstance = null; // Analytics is temporarily disabled
  performanceInstance = typeof window !== 'undefined' ? getPerformance(appInstance) : null;
  
  return {
    firebaseApp: appInstance,
    auth: authInstance,
    firestore: firestoreInstance,
    functions: functionsInstance,
    analytics: analyticsInstance,
    performance: performanceInstance,
  };
}

// Initialize services immediately so they can be exported
const { auth, firestore } = initializeFirebaseServices();

export { auth, firestore };

// Re-export the initialization function if it's needed elsewhere, though direct exports are preferred.
export function initializeFirebase() {
    return initializeFirebaseServices();
}


export * from './provider';
export * from './errors';
export * from './error-emitter';
export * from './analytics';
