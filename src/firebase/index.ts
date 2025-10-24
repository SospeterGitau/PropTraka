
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
    // DO NOT commit this to your repository if it's public.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider("6Le-............-...."), 
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
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export * from './analytics';
