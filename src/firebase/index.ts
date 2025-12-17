
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getPerformance } from 'firebase/performance';
import { firebaseConfig } from './config';

// --- SERVICE INITIALIZATION ---

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Check if we're in a browser environment and on localhost
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

// Initialize Auth
const auth: Auth = getAuth(app);
if (isLocalhost) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: false });
    // eslint-disable-next-line no-console
    console.info('✅ Firebase Auth → Emulator (localhost:9099)');
  } catch (e: any) {
    if (!e?.message?.includes('already')) {
      // eslint-disable-next-line no-console
      console.error('❌ Auth emulator connection FAILED:', e?.message || e);
      // eslint-disable-next-line no-console
      console.warn('⚠️  Make sure emulators are running: npm run emulator:start');
    }
  }
}

// Set auth persistence to LOCAL (browser storage)
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to set auth persistence:', error);
  });
}

// Initialize Firestore with emulator if on localhost
const firestore: Firestore = getFirestore(app);
if (isLocalhost) {
  try {
    // CRITICAL: This must be called synchronously during module init
    // Use 127.0.0.1 instead of 'localhost' to avoid IPv6 issues
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    // eslint-disable-next-line no-console
    console.info('✅ Firestore → Emulator (127.0.0.1:8080)');
  } catch (e: any) {
    // The "custom object" error happens when emulator is already connected - this is OK
    if (!e?.message?.includes('already') && !e?.message?.includes('custom')) {
      // eslint-disable-next-line no-console
      console.error('❌ Firestore emulator connection FAILED:', e?.message || e);
      // eslint-disable-next-line no-console
      console.warn('⚠️  Make sure emulators are running: npm run emulator:start');
    }
  }
}

const functions: Functions = getFunctions(app);
const performance: ReturnType<typeof getPerformance> | null = typeof window !== 'undefined' ? getPerformance(app) : null;

// Export initialized services
export { auth, firestore, functions, performance };


// --- HOOKS AND PROVIDERS ---

// Re-export all hooks and providers from the central provider file.
// This ensures that all components use the same context-aware instances.
export * from './provider';
export * from './errors';
export * from './error-emitter';
// Convenience re-exports for commonly-used hooks and instances.
export { useUser } from './auth';

/**
 * Simple hook to access the Firestore instance.
 * Some parts of the codebase call `useFirestore()` — provide a small wrapper
 * that returns the same `firestore` instance exported above.
 */
export const useFirestore = (): Firestore => firestore;

/**
 * Lightweight accessor returning the core Firebase services. Kept synchronous
 * (not a React hook) so it can be used in both client and server contexts
 * when appropriate.
 */
export const useFirebase = () => ({ app, auth, firestore, functions, performance });
