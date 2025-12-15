
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getPerformance } from 'firebase/performance';
import { firebaseConfig } from './config';

// --- SERVICE INITIALIZATION ---

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);
export const performance: ReturnType<typeof getPerformance> | null = typeof window !== 'undefined' ? getPerformance(app) : null;


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
