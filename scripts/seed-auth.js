/**
 * seeds Auth emulator with test users in an idempotent way.
 * Usage: FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node scripts/seed-auth.js
 * Safety: refuses to run against production unless ALLOW_REAL_SEED=true is set.
 */
const admin = require('firebase-admin');

const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'studio-4661291525-66fea';

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.ALLOW_REAL_SEED !== 'true') {
  console.error('\n❌ Refusing to run Auth seed against production.');
  console.error('   To seed production intentionally, set ALLOW_REAL_SEED=true and ensure you understand the impact.');
  console.error('   To run locally with the Auth emulator, set FIREBASE_AUTH_EMULATOR_HOST=localhost:9099.\n');
  process.exit(1);
}

process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;

// Initialize admin SDK for the given project id
if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const auth = admin.auth();

const usersToSeed = [
  {
    uid: 'test-user-001',
    email: 'test-user@example.com',
    // Strong test password (>= 6 chars). Change if you need a different value.
    password: 'TestUserPass123!',
    displayName: 'Seed Test User',
    emailVerified: true,
  },
  {
    uid: '5kalINQOGmY5KvabpGfTD2Kxfu03',
    email: 'owner@example.com',
    password: 'OwnerPass123!',
    displayName: 'Seed Owner',
    emailVerified: true,
  },
];

// Friendly output for developers
console.log('\n-- Auth seed will ensure these credentials exist (use them to sign in while developing):');
usersToSeed.forEach(u => console.log(`   ${u.email} / ${u.password}`));

async function ensureUser(u) {
  try {
    const existing = await auth.getUser(u.uid);
    console.log(`   ✓ User exists: ${u.uid} (${existing.email}) — updating password/email/displayName if needed`);
    await auth.updateUser(u.uid, { email: u.email, password: u.password, displayName: u.displayName });
    return;
  } catch (err) {
    // if user not found, create it
    if (err.code === 'auth/user-not-found' || err.message?.includes('not found')) {
      try {
        await auth.createUser(u);
        console.log(`   ✓ Created user: ${u.uid} (${u.email})`);
      } catch (createErr) {
        console.error(`❌ Failed to create user ${u.uid}:`, createErr.message || createErr);
      }
    } else {
      console.error(`❌ Error when fetching user ${u.uid}:`, err.message || err);
    }
  }
}

(async function seed() {
  console.log('\n🌱 Seeding Auth emulator with test users...');
  for (const u of usersToSeed) {
    // eslint-disable-next-line no-await-in-loop
    await ensureUser(u);
  }
  console.log('\n✨ Auth seeding complete.');
  process.exit(0);
})();
