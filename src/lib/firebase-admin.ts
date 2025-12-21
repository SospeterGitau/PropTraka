import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

if (!getApps().length) {
    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        // Fallback for when no service account is present (e.g. build time or dev without secrets)
        // Note: This will fail at runtime if authentication is attempted without creds.
        // In production, FIREBASE_SERVICE_ACCOUNT must be set.
        console.warn('FIREBASE_SERVICE_ACCOUNT not found. Admin SDK initialized without credentials.');
        initializeApp();
    }
}

export const adminDb = getFirestore();
