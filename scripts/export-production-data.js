/**
 * Export production Firestore data for import into emulator.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./.firebase/service-account.json node scripts/export-production-data.js
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', '.firebase', 'service-account.json'));

// Initialize with production credentials (NO emulator host)
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = app.firestore();

async function exportCollection(collectionName) {
  console.log(`📦 Exporting ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  const docs = [];
  
  snapshot.forEach(doc => {
    docs.push({
      id: doc.id,
      data: doc.data(),
    });
  });
  
  console.log(`   ✓ Exported ${docs.length} documents from ${collectionName}`);
  return docs;
}

async function main() {
  console.log('🔥 Exporting production Firestore data...\n');
  
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
  
  const exportData = {};
  
  for (const collectionName of collections) {
    try {
      exportData[collectionName] = await exportCollection(collectionName);
    } catch (error) {
      console.error(`❌ Error exporting ${collectionName}:`, error.message);
      exportData[collectionName] = [];
    }
  }
  
  const outputPath = path.join(__dirname, '..', 'firestore-export.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  
  console.log(`\n✅ Export complete! Data saved to: ${outputPath}`);
  console.log('\n📊 Summary:');
  Object.entries(exportData).forEach(([collection, docs]) => {
    console.log(`   ${collection}: ${docs.length} documents`);
  });
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Export failed:', error);
  process.exit(1);
});
