
import { initializeApp, getApps, getApp, App, applicationDefault } from 'firebase-admin/app';
import { firebaseConfig } from './config';

const appName = 'firebase-admin-app';

function createAdminApp(): App {
  if (getApps().find((app) => app.name === appName)) {
    return getApp(appName);
  }

  // Use applicationDefault() to automatically find and use the service account
  // provided by the App Hosting environment.
  return initializeApp(
    {
      credential: applicationDefault(),
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
      storageBucket: `${firebaseConfig.projectId}.appspot.com`,
    },
    appName
  );
}


export function getAdminApp(): App {
    return createAdminApp();
}
