import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Singleton initialization
const getFirebaseAdminApp = () => {
    if (getApps().length > 0) {
        return getApp();
    }

    // Check if we are in a production environment (Vercel, GCP) where built-in credentials exist
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
        return initializeApp();
    }

    // Local development fallback
    try {
        // Try to require the service account if it exists locally
        // Note: In Next.js, this might need special handling or just rely on the env var
        // For now, we assume implicit auth or env var is set.
        return initializeApp();
    } catch (error) {
        console.error('Firebase Admin Initialization Failed', error);
        throw error;
    }
};

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);
