import "server-only";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
);

// Prevent re-initialization
const app =
    getApps().length === 0
        ? initializeApp({
            credential: {
                getAccessToken: async () => {
                    return {
                        access_token: "mock-token",
                        expires_in: 3600
                    }
                }
            },
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'proptraka-app',
        })
        : getApp();

// If we have a service account key, use it. Otherwise, for dev without creds, we might need a workaround or just let it fail/warn if not needed locally.
// Actually, better to try/catch or strict check.
// For this environment, we assume GOOGLE_APPLICATION_CREDENTIALS or SERVICE_ACCOUNT is set for real usage.
// If purely client-side emulators, admin might not be needed? But we are doing server actions.
// Let's stick to standard init.

if (getApps().length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        initializeApp({
            credential: require('firebase-admin').credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
        });
    } else {
        initializeApp(); // Uses GOOGLE_APPLICATION_CREDENTIALS
    }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
