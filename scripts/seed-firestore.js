const admin = require('firebase-admin');

// Initialize emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const db = admin.initializeApp({
  projectId: 'studio-6577669797-1b758',
}).firestore();

const TEST_UID = 'test-user-001';

async function seed() {
  console.log('🌱 Seeding Firestore with sample data...\n');
  
  try {
    // 1. Create sample property
    console.log('📦 Creating property...');
    const propRef = await db.collection('properties').add({
      ownerId: TEST_UID,
      addressLine1: '123 Westlands Avenue',
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
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });
    const propId = propRef.id;
    console.log(`   ✓ Property: ${propId}\n`);

    // 2. Create sample tenant
    console.log('👤 Creating tenant...');
    const tenantRef = await db.collection('tenants').add({
      ownerId: TEST_UID,
      firstName: 'John',
      lastName: 'Kariuki',
      email: 'john@example.com',
      phone: '+254712345678',
      idType: 'NATIONAL_ID',
      idNumber: '12345678',
      employmentStatus: 'Employed',
      employer: 'Tech Corp',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });
    const tenantId = tenantRef.id;
    console.log(`   ✓ Tenant: ${tenantId}\n`);

    // 3. Create sample tenancy
    console.log('🏠 Creating tenancy...');
    const tenancyRef = await db.collection('tenancies').add({
      ownerId: TEST_UID,
      propertyId: propId,
      tenantId: tenantId,
      leaseStartDate: '2025-01-01',
      leaseEndDate: '2026-01-01',
      rentAmount: 45000,
      securityDeposit: 90000,
      paymentFrequency: 'monthly',
      status: 'active',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });
    const tenancyId = tenancyRef.id;
    console.log(`   ✓ Tenancy: ${tenancyId}\n`);

    // 4. Create sample revenue/transaction
    console.log('💰 Creating revenue transaction...');
    await db.collection('revenue').add({
      ownerId: TEST_UID,
      tenancyId: tenancyId,
      propertyId: propId,
      rent: 45000,
      paymentDate: new Date().toISOString(),
      dueDate: '2025-12-01',
      status: 'paid',
      paymentMethod: 'bank_transfer',
      type: 'rent',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });
    console.log(`   ✓ Revenue transaction created\n`);

    // 5. Create sample contractor
    console.log('🔧 Creating contractor...');
    const contractorRef = await db.collection('contractors').add({
      ownerId: TEST_UID,
      name: 'Swift Plumbing',
      type: 'plumber',
      email: 'contact@swiftplumbing.com',
      phone: '+254722123456',
      specialization: ['Pipe Installation', 'Leak Repair'],
      rating: 4.8,
      totalJobsDone: 45,
      isActive: true,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });
    const contractorId = contractorRef.id;
    console.log(`   ✓ Contractor: ${contractorId}\n`);

    // 6. Create sample expense
    console.log('📊 Creating expense...');
    await db.collection('expenses').add({
      ownerId: TEST_UID,
      propertyId: propId,
      contractorId: contractorId,
      category: 'maintenance',
      description: 'Monthly plumbing inspection',
      amount: 5000,
      date: new Date().toISOString(),
      status: 'paid',
      paymentMethod: 'mpesa',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });
    console.log(`   ✓ Expense created\n`);

    console.log('✨ Seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   Properties: 1 (${propId})`);
    console.log(`   Tenants: 1 (${tenantId})`);
    console.log(`   Tenancies: 1 (${tenancyId})`);
    console.log(`   Contractors: 1 (${contractorId})`);
    console.log(`   Revenue: 1`);
    console.log(`   Expenses: 1`);
    console.log('\n🔑 Test User ID: test-user-001\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
