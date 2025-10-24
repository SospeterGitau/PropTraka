
import { initializeApp, getApps, getApp, App, applicationDefault } from 'firebase-admin/app';
import { firebaseConfig } from './config';

const appName = 'firebase-admin-app';

// This function is no longer used for the primary login flow,
// but is kept for other potential server-side admin tasks.
function createAdminApp(): App {
  if (getApps().find((app) => app.name === appName)) {
    return getApp(appName);
  }

  // Use applicationDefault() to automatically find and use the service account
  // provided by the App Hosting environment.
  // This might fail in local dev if GOOGLE_APPLICATION_CREDENTIALS is not set.
  try {
    return initializeApp(
      {
        credential: applicationDefault(),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
        storageBucket: `${firebaseConfig.projectId}.appspot.com`,
      },
      appName
    );
  } catch(e) {
    console.error("Could not initialize Firebase Admin SDK. Service account credentials might be missing.", e);
    // Return a dummy object or handle the error gracefully
    // For now, we'll let it throw, but in a real app you might want a fallback.
    throw e;
  }
}


export function getAdminApp(): App {
    return createAdminApp();
}
