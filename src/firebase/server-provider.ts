'use server';

/**
 * @fileoverview This file provides a server-side mechanism for initializing
 * and accessing the Firebase Admin SDK. It ensures that the Admin SDK is
 * initialized only once, following a singleton pattern.
 *
 * This is crucial for server-side operations (like in Server Actions or API routes)
 * that need to interact with Firebase services with administrative privileges,
 * such as creating custom tokens or interacting with Firestore without
 * security rule constraints.
 */

import * as admin from 'firebase-admin';

// Check if the default Firebase app has already been initialized.
// The 'getApps()' method returns an array of all initialized apps.
// If the array's length is zero, no apps have been initialized.
if (!admin.apps.length) {
  // If no app is initialized, create a new one.
  // 'initializeApp()' without arguments will use the service account credentials
  // found in the GOOGLE_APPLICATION_CREDENTIALS environment variable.
  admin.initializeApp();
}

const auth = admin.auth();
const firestore = admin.firestore();

/**
 * Returns the initialized Firebase Admin SDK services.
 * This function acts as the public interface for accessing the singleton
 * instances of the Admin services.
 *
 * @returns An object containing the initialized Firebase Admin services.
 */
export async function getFirebase() {
  return { auth, firestore, admin };
}