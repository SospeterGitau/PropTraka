/**
 * Clear all sample data from Firestore (production or emulator).
 * Only deletes documents marked with `isSampleData: true`.
 * 
 * Usage:
 * - Emulator: FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/clear-sample-data.js
 * - Production: GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json node scripts/clear-sample-data.js
 */
const admin = require('firebase-admin');
const path = require('path');

// Check if we're targeting the emulator
const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

if (isEmulator) {
  console.log('🔧 Using Firestore Emulator at', process.env.FIRESTORE_EMULATOR_HOST);
  var app = admin.initializeApp({
    projectId: 'studio-4661291525-66fea',
  });
} else {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                             path.join(__dirname, '..', '.firebase', 'service-account.json');
  const serviceAccount = require(serviceAccountPath);
  var app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = app.firestore();

async function clearSampleDataFromCollection(collectionName) {
  console.log(`🗑️  Clearing sample data from ${collectionName}...`);
  
  const snapshot = await db.collection(collectionName)
    .where('isSampleData', '==', true)
    .get();
  
  if (snapshot.empty) {
    console.log(`   ⏭️  No sample data found in ${collectionName}`);
    return 0;
  }
  
  const batch = db.batch();
  let count = 0;
  
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });
  
  await batch.commit();
  console.log(`   ✓ Deleted ${count} sample documents from ${collectionName}`);
  
  return count;
}

async function main() {
  console.log('\n🧹 Clearing sample data (isSampleData: true)...\n');
  
  const collections = [
    'properties',
    'tenants',
    'tenancies',
    'revenue',
    'expenses',
    'contractors',
    'maintenanceRequests',
  ];
  
  let totalDeleted = 0;
  
  for (const collectionName of collections) {
    try {
      const deleted = await clearSampleDataFromCollection(collectionName);
      totalDeleted += deleted;
    } catch (error) {
      console.error(`❌ Error clearing ${collectionName}:`, error.message);
    }
  }
  
  console.log(`\n✅ Complete! Deleted ${totalDeleted} sample documents total.`);
  console.log('💡 Your personal data (without isSampleData: true) remains untouched.\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Failed to clear sample data:', error);
  process.exit(1);
});
