'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  if (typeof window !== 'undefined') {
    // This allows App Check to work in a local development environment.
    // DO NOT a-commit this to your repository.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    
    initializeAppCheck(app, {
      // IMPORTANT: Replace this placeholder with your actual reCAPTCHA v3 site key
      // from the Firebase console before deploying to production.
      provider: new ReCaptchaV3Provider("6Ld-............-...."), 
      isTokenAutoRefreshEnabled: true
    });
  }

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
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export * from './analytics';
