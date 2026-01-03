import "server-only";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as path from 'path';
import * as fs from 'fs';

const getFirebaseApp = () => {
    if (getApps().length) {
        return getApp();
    }

    try {
        let credential;

        // 1. Try Local File (Method A)
        // We use process.cwd() to find the file in the root
        try {
            const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
            // We use fs.existsSync to check without throwing
            if (fs.existsSync(serviceAccountPath)) {
                console.log('🔥 Initializing Firebase Admin with local serviceAccountKey.json');
                credential = cert(serviceAccountPath);
            }
        } catch (e) {
            // Ignore file errors, fallback to env
        }

        // 2. Try Environment Variable (Method B)
        if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            console.log('🔥 Initializing Firebase Admin with FIREBASE_SERVICE_ACCOUNT_KEY env var');
            credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
        }

        if (!credential) {
            console.warn('⚠️ No Firebase Admin credentials found. Server-side features may fail.');
            // Fallback to applicationDefault() if running in GCP context
            return initializeApp();
        }

        return initializeApp({
            credential,
            projectId: "studio-4661291525-66fea", // Hardcoded ID from .firebaserc
            storageBucket: "studio-4661291525-66fea.firebasestorage.app"
        });

    } catch (error) {
        console.error('Firebase Admin initialization error', error);
        return getApp(); // Try to return default app if init fails (likely already initialized)
    }
}

export const app = getFirebaseApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
