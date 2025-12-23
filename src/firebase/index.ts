
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getPerformance } from 'firebase/performance';
import { firebaseConfig } from './config';

// --- SERVICE INITIALIZATION ---

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Check if we should use emulators
// Only connect to emulators if explicitly enabled via environment variable
const useEmulators = typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

// Initialize Auth
const auth: Auth = getAuth(app);
if (useEmulators) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: false });
    // eslint-disable-next-line no-console
    console.info('✅ Firebase Auth → Emulator (localhost:9099)');
  } catch (e: any) {
    if (!e?.message?.includes('already')) {
      // eslint-disable-next-line no-console
      console.error('❌ Auth emulator connection FAILED:', e?.message || e);
    }
  }
} else {
  // eslint-disable-next-line no-console
  console.info('🌐 Firebase Auth → Production');
}

// Set auth persistence to LOCAL (browser storage)
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to set auth persistence:', error);
  });
}

// Initialize Firestore with emulator if enabled
const firestore: Firestore = getFirestore(app);
if (useEmulators) {
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
    }
  }
} else {
  // eslint-disable-next-line no-console
  console.info('🌐 Firestore → Production');
}

import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// ... (existing imports)

// Initialize Firestore
// ...

// Initialize Storage
const storage: FirebaseStorage = getStorage(app);
if (useEmulators) {
  try {
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    // eslint-disable-next-line no-console
    console.info('✅ Storage → Emulator (127.0.0.1:9199)');
  } catch (e: any) {
    if (!e?.message?.includes('already')) {
      // eslint-disable-next-line no-console
      console.error('❌ Storage emulator connection FAILED:', e?.message || e);
    }
  }
} else {
  // eslint-disable-next-line no-console
  console.info('🌐 Storage → Production');
}

import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// ... (existing imports)

// Initialize Storage
// ...

const functions: Functions = getFunctions(app);
const performance: ReturnType<typeof getPerformance> | null = typeof window !== 'undefined' ? getPerformance(app) : null;

// Initialize Analytics (Client-Side Only)
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.info('✅ Firebase Analytics → Initialized');
    }
  });
}

// Initialize App Check (Client-Side Only)
// Use a placeholder key for dev if env var is missing to prevent crashes, but warn loud.
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
if (typeof window !== 'undefined' && RECAPTCHA_SITE_KEY) {
  // Only init if key exists to avoid errors in dev without keys
  try {
    // Self-signed token or debug token for localhost is handled via debugToken option if needed
    // For now, standard initialization
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.info('✅ Firebase App Check → Initialized');
  } catch (e) {
    console.warn('⚠️ Firebase App Check failed to initialize:', e);
  }
} else if (typeof window !== 'undefined') {
  console.warn('⚠️ Firebase App Check Skipped: NEXT_PUBLIC_RECAPTCHA_SITE_KEY not set');
}


// Export initialized services
export { auth, firestore, storage, functions, performance, analytics };


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
