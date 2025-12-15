
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

const FIREBASE_PROJECT_ID = 'studio-4661291525-66fea';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const uid = 'Pr92v8LZJlf7WOHvmQbpZDQZDZ43';
const email = 'owner@example.com';
const password = 'password123';

(async () => {
  try {
    try {
      await admin.auth().getUser(uid);
      console.log(`User ${uid} already exists. Updating...`);
      await admin.auth().updateUser(uid, {
        email: email,
        password: password,
        emailVerified: true,
        displayName: 'Test Owner'
      });
      console.log('User updated successfully.');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`Creating user ${uid}...`);
        await admin.auth().createUser({
          uid: uid,
          email: email,
          password: password,
          emailVerified: true,
          displayName: 'Test Owner'
        });
        console.log('User created successfully.');
      } else {
        throw error;
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    process.exit(1);
  }
})();
