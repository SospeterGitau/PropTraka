
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getPerformance, Performance } from 'firebase/performance';
import { firebaseConfig } from './config';

// --- SERVICE INITIALIZATION ---

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);
export const performance: Performance | null = typeof window !== 'undefined' ? getPerformance(app) : null;


// --- HOOKS AND PROVIDERS ---

// Re-export all hooks and providers from the central provider file.
// This ensures that all components use the same context-aware instances.
export * from './provider';
export * from './errors';
export * from './error-emitter';
