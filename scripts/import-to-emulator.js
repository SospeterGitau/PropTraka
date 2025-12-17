/**
 * Import exported Firestore data into the emulator.
 * Usage: FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/import-to-emulator.js
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Point to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const app = admin.initializeApp({
  projectId: 'studio-4661291525-66fea',
});

const db = app.firestore();

async function importCollection(collectionName, docs) {
  console.log(`📥 Importing ${docs.length} documents to ${collectionName}...`);
  
  let imported = 0;
  for (const doc of docs) {
    try {
      await db.collection(collectionName).doc(doc.id).set(doc.data);
      imported++;
    } catch (error) {
      console.error(`   ⚠️  Failed to import ${doc.id}:`, error.message);
    }
  }
  
  console.log(`   ✓ Imported ${imported}/${docs.length} documents to ${collectionName}`);
  return imported;
}

async function main() {
  const exportPath = path.join(__dirname, '..', 'firestore-export.json');
  
  if (!fs.existsSync(exportPath)) {
    console.error('❌ Export file not found. Run export-production-data.js first.');
    process.exit(1);
  }
  
  console.log('🔥 Importing production data to emulator...\n');
  
  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  
  const summary = {};
  
  for (const [collectionName, docs] of Object.entries(exportData)) {
    if (docs.length > 0) {
      const imported = await importCollection(collectionName, docs);
      summary[collectionName] = imported;
    } else {
      console.log(`⏭️  Skipping empty collection: ${collectionName}`);
    }
  }
  
  console.log('\n✅ Import complete!');
  console.log('\n📊 Summary:');
  Object.entries(summary).forEach(([collection, count]) => {
    console.log(`   ${collection}: ${count} documents`);
  });
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
