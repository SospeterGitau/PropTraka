
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { firebaseConfig } from './config';

// It's safe to import this on the server
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

const appName = 'firebase-admin-app';

function createAdminApp(): App {
  if (getApps().find((app) => app.name === appName)) {
    return getApp(appName);
  }

  return initializeApp(
    {
      credential: {
        // You can use a service account for admin access
        // This is necessary for server-side operations that bypass security rules
        // For now, we're using basic config which is fine for user management
        projectId: serviceAccount?.project_id || firebaseConfig.projectId,
        clientEmail: serviceAccount?.client_email,
        privateKey: serviceAccount?.private_key,
      },
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
      storageBucket: `${firebaseConfig.projectId}.appspot.com`,
    },
    appName
  );
}


export function getAdminApp(): App {
    return createAdminApp();
}
