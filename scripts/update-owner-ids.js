/**
 * Update all ownerIds in the emulator to match the test user.
 * Usage: FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/update-owner-ids.js
 */
const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const app = admin.initializeApp({
  projectId: 'studio-4661291525-66fea',
});

const db = app.firestore();

const TARGET_UID = 'test-user-001';

async function updateCollection(collectionName) {
  console.log(`🔄 Updating ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  
  let updated = 0;
  const batch = db.batch();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.ownerId && data.ownerId !== TARGET_UID) {
      batch.update(doc.ref, { ownerId: TARGET_UID });
      updated++;
    }
  });
  
  if (updated > 0) {
    await batch.commit();
    console.log(`   ✓ Updated ${updated} documents in ${collectionName}`);
  } else {
    console.log(`   ⏭️  No updates needed for ${collectionName}`);
  }
  
  return updated;
}

async function main() {
  console.log(`🔥 Updating all ownerIds to: ${TARGET_UID}\n`);
  
  const collections = [
    'properties',
    'tenants',
    'tenancies',
    'revenue',
    'expenses',
    'contractors',
    'maintenanceRequests',
    'userSettings',
  ];
  
  let totalUpdated = 0;
  
  for (const collectionName of collections) {
    try {
      const updated = await updateCollection(collectionName);
      totalUpdated += updated;
    } catch (error) {
      console.error(`❌ Error updating ${collectionName}:`, error.message);
    }
  }
  
  console.log(`\n✅ Complete! Updated ${totalUpdated} documents total.`);
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Update failed:', error);
  process.exit(1);
});
