/**
 * Load sample data into Firestore (production or emulator).
 * All sample data is marked with `isSampleData: true` so it can be cleared later.
 * 
 * Usage:
 * - Emulator: FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/load-sample-data.js
 * - Production (NOT RECOMMENDED): GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json node scripts/load-sample-data.js
 */
const admin = require('firebase-admin');
const path = require('path');

// Check if we're targeting the emulator
const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

if (!isEmulator) {
  console.warn('\n⚠️  WARNING: You are about to load sample data into PRODUCTION Firestore!');
  console.warn('   This is generally NOT recommended. Press Ctrl+C to cancel.\n');
  
  // Give user 5 seconds to cancel
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  setTimeout(() => {
    readline.close();
    initAndLoad();
  }, 5000);
  
  console.log('   Starting in 5 seconds... (Ctrl+C to cancel)');
} else {
  initAndLoad();
}

async function initAndLoad() {
  // Initialize Firebase Admin
  let app;
  if (isEmulator) {
    console.log('🔧 Using Firestore Emulator at', process.env.FIRESTORE_EMULATOR_HOST);
    // Set env var to prevent metadata lookup
    process.env.GCLOUD_PROJECT = 'studio-4661291525-66fea';
    app = admin.initializeApp({
      projectId: 'studio-4661291525-66fea',
    });
  } else {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                               path.join(__dirname, '..', '.firebase', 'service-account.json');
    const serviceAccount = require(serviceAccountPath);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  const db = app.firestore();

  // Use test-user-001 as the owner for sample data
  const SAMPLE_OWNER_ID = 'test-user-001';

  console.log('\n🌱 Loading sample data (marked with isSampleData: true)...');
  console.log(`   Owner ID: ${SAMPLE_OWNER_ID}\n`);

  const sampleData = {
    properties: [
      {
        addressLine1: 'Sample Property 1 - Westlands',
        city: 'Nairobi',
        county: 'Nairobi',
        propertyType: 'Domestic',
        bedrooms: 3,
        bathrooms: 2,
        size: 2500,
        sizeUnit: 'sqft',
        purchasePrice: 5000000,
        mortgage: 2500000,
        currentValue: 5500000,
        rentalValue: 45000,
        ownerId: SAMPLE_OWNER_ID,
        isSampleData: true,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      },
      {
        addressLine1: 'Sample Property 2 - Karen',
        city: 'Nairobi',
        county: 'Nairobi',
        propertyType: 'Commercial',
        bedrooms: 0,
        bathrooms: 3,
        size: 5000,
        sizeUnit: 'sqft',
        purchasePrice: 12000000,
        mortgage: 6000000,
        currentValue: 13000000,
        rentalValue: 120000,
        ownerId: SAMPLE_OWNER_ID,
        isSampleData: true,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      },
    ],
    tenants: [
      {
        firstName: 'Sample',
        lastName: 'Tenant',
        email: 'sample.tenant@example.com',
        phone: '+254700000000',
        idType: 'NATIONAL_ID',
        idNumber: 'SAMPLE123',
        employmentStatus: 'Employed',
        employer: 'Sample Corp',
        ownerId: SAMPLE_OWNER_ID,
        isSampleData: true,
        createdDate: new Date().toISOString(),
      },
    ],
  };

  try {
    // Load properties
    console.log('📦 Loading sample properties...');
    for (const prop of sampleData.properties) {
      const ref = await db.collection('properties').add(prop);
      console.log(`   ✓ Created property: ${ref.id}`);
    }

    // Load tenants
    console.log('\n👤 Loading sample tenants...');
    for (const tenant of sampleData.tenants) {
      const ref = await db.collection('tenants').add(tenant);
      console.log(`   ✓ Created tenant: ${ref.id}`);
    }

    console.log('\n✅ Sample data loaded successfully!');
    console.log('\n💡 To clear sample data later, run: npm run sample-data:clear');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error loading sample data:', error);
    process.exit(1);
  }
}
