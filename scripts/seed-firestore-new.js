
// To run this script:
// 1. Make sure you have Node.js installed.
// 2. Install Firebase Admin SDK: npm install firebase-admin
// 3. Obtain a Firebase service account key JSON file from your Firebase project settings
//    (Project settings -> Service accounts -> Generate new private key).
// 4. Save the JSON file as `serviceAccountKey.json` in the **root directory of your project**
//    (i.e., at the same level as your `package.json` and `scripts` folder).
// 5. Replace `YOUR_FIREBASE_PROJECT_ID` and `YOUR_OWNER_UID` below.
// 6. Run: node scripts/seed-firestore-new.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Allow service account to be provided via env var (FIREBASE_SERVICE_ACCOUNT) or
// via a file path in GOOGLE_APPLICATION_CREDENTIALS or ./serviceAccountKey.json (legacy).
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON.');
      process.exit(1);
    }
  }

  // If GOOGLE_APPLICATION_CREDENTIALS points to a file, prefer it
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'serviceAccountKey.json');
  if (fs.existsSync(credPath)) {
    try {
      return require(credPath);
    } catch (err) {
      console.error('❌ Failed to load service account from', credPath, err.message || err);
      process.exit(1);
    }
  }

  // Also accept a service account placed at the recommended path
  const altPath = path.join(__dirname, '..', '.firebase', 'service-account.json');
  if (fs.existsSync(altPath)) {
    try { return require(altPath); } catch (err) { console.error('❌ Failed to load service account from', altPath, err.message || err); process.exit(1); }
  }

  console.error('❌ No service account found. Set FIREBASE_SERVICE_ACCOUNT env var or place a JSON at .firebase/service-account.json and set GOOGLE_APPLICATION_CREDENTIALS accordingly.');
  process.exit(1);
}

const serviceAccount = loadServiceAccount();

// Safety check: refuse to run against production Firestore unless explicitly allowed.
// To intentionally seed a real project, set ALLOW_REAL_SEED=true in your environment.
if (!process.env.FIRESTORE_EMULATOR_HOST && process.env.ALLOW_REAL_SEED !== 'true') {
  console.error('\n❌ Refusing to run seed against production Firestore.');
  console.error('   To seed production intentionally, set ALLOW_REAL_SEED=true and ensure you understand the impact.');
  console.error('   To run locally with the emulator, run the emulator (\`npm run emulator:start\`) or set FIRESTORE_EMULATOR_HOST=localhost:8080.\n');
  process.exit(1);
}

// --- CONFIGURATION ---
const FIREBASE_PROJECT_ID = 'studio-4661291525-66fea'; // CORRECTED: Reverted to the project ID from your service account key
const OWNER_UID = '5kalINQOGmY5KvabpGfTD2Kxfu03'; // Use a consistent UID for all seeded data

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Helper to convert Date objects to Firestore Timestamps
const toTimestamp = (date) => admin.firestore.Timestamp.fromDate(date);

// --- Sample Data Generation Functions ---

// Generate a random number within a range
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const getRandomElement = (arr) => arr[getRandomInt(0, arr.length - 1)];

const generateAddress = () => ({
  street: `${getRandomInt(10, 999)} ${getRandomElement(['Main', 'Oak', 'Pine', 'Cedar', 'Maple'])} St`,
  city: getRandomElement(['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret']),
  state: getRandomElement(['Nairobi County', 'Mombasa County', 'Kisumu County', 'Nakuru County', 'Uasin Gishu County']),
  zipCode: `00${getRandomInt(100, 999)}`,
  country: 'Kenya',
});

const generateProperty = (ownerId, nameSuffix = '') => {
  const type = getRandomElement(['Residential', 'Commercial', 'Mixed-Use']);
  const yearBuilt = getRandomInt(1980, 2020);
  const purchasePrice = parseFloat(getRandomFloat(5000000, 50000000));
  const targetRent = parseFloat(getRandomFloat(20000, 200000));

  return {
    ownerId,
    name: `${getRandomElement(['Greenview', 'Sunrise', 'City Central', 'Executive', 'Coastal'])} ${nameSuffix} ${type === 'Residential' ? 'Residences' : 'Plaza'}`,
    type,
    address: generateAddress(),
    purchaseDate: toTimestamp(new Date(getRandomInt(2000, 2020), getRandomInt(0, 11), getRandomInt(1, 28))),
    purchasePrice: parseFloat(purchasePrice),
    currentValue: parseFloat(getRandomFloat(parseFloat(purchasePrice) * 0.9, parseFloat(purchasePrice) * 1.5)),
    mortgageBalance: parseFloat(getRandomFloat(0, parseFloat(purchasePrice) * 0.8)),
    targetRent: parseFloat(targetRent),
    bedrooms: type === 'Residential' ? getRandomInt(1, 5) : undefined,
    bathrooms: type === 'Residential' ? getRandomInt(1, 4) : undefined,
    squareFootage: getRandomInt(500, 5000),
    yearBuilt,
    amenities: getRandomElement([['Pool', 'Gym'], ['Parking', 'Security'], ['Balcony'], []]),
    description: `A beautiful ${type.toLowerCase()} property built in ${yearBuilt}.`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

const generateTenant = (ownerId) => ({
  ownerId,
  firstName: getRandomElement(['Alice', 'Bob', 'Catherine', 'David', 'Eve', 'Frank', 'Grace', 'Henry']),
  lastName: getRandomElement(['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore']),
  email: `tenant${getRandomInt(1000, 9999)}@example.com`,
  phoneNumber: `+2547${getRandomInt(10000000, 99999999)}`,
  dateOfBirth: toTimestamp(new Date(getRandomInt(1970, 2000), getRandomInt(0, 11), getRandomInt(1, 28))),
  idType: getRandomElement(['National ID', 'Passport']),
  idNumber: `${getRandomInt(10000000, 99999999)}`,
  emergencyContactName: getRandomElement(['Jane Doe', 'John Smith']),
  emergencyContactNumber: `+2547${getRandomInt(10000000, 99999999)}`,
  notes: getRandomElement(['Good tenant.', 'Pays on time.', 'Needs reminder sometimes.', 'Quiet.']),
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const generateTenancy = (ownerId, propertyId, tenantId, status) => {
  const startDate = new Date(getRandomInt(2021, 2023), getRandomInt(0, 11), getRandomInt(1, 28));
  const endDate = new Date(startDate.getFullYear() + getRandomInt(1, 3), getRandomInt(0, 11), getRandomInt(1, 28));
  const rentAmount = parseFloat(getRandomFloat(25000, 150000));
  const depositAmount = rentAmount * parseFloat(getRandomFloat(1, 2));
  const serviceChargeAmount = parseFloat(getRandomFloat(1000, 5000));

  return {
    ownerId,
    propertyId,
    tenantId,
    startDate: toTimestamp(startDate),
    endDate: toTimestamp(status === 'Ended' ? new Date(startDate.getFullYear() + getRandomInt(0,1), getRandomInt(0,11), getRandomInt(1,28)) : endDate),
    rentAmount,
    depositAmount,
    serviceChargeAmount: Math.random() > 0.5 ? serviceChargeAmount : undefined,
    paymentFrequency: getRandomElement(['Monthly', 'Quarterly']),
    status,
    leaseAgreementUrl: Math.random() > 0.5 ? `https://docs.example.com/lease_${propertyId}_${tenantId}.pdf` : undefined,
    moveInChecklistUrl: Math.random() > 0.5 ? `https://docs.example.com/movein_${propertyId}_${tenantId}.pdf` : undefined,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

const generateRevenueTransaction = (ownerId, tenancyId, propertyId, tenantId, date, type, amount, status) => ({
  ownerId,
  tenancyId,
  propertyId,
  tenantId,
  amount,
  date: toTimestamp(date),
  type,
  paymentMethod: getRandomElement(['M-Pesa', 'Bank Transfer', 'Cash']),
  status,
  invoiceNumber: `INV-${tenancyId}-${Math.random().toString(36).substring(7)}`,
  notes: getRandomElement(['Paid on time', 'Late payment', 'Partial payment received']),
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const expenseCategories = ['Repairs', 'Utilities', 'Insurance', 'Taxes', 'Management Fees', 'Cleaning', 'Other'];
const generateExpense = (ownerId, propertyId, contractorId) => {
  const amount = parseFloat(getRandomFloat(1000, 50000));
  const isRecurring = Math.random() > 0.7;
  return {
    ownerId,
    propertyId: Math.random() > 0.3 ? propertyId : undefined, // Some expenses are general
    contractorId: Math.random() > 0.5 ? contractorId : undefined,
    amount,
    date: toTimestamp(new Date(getRandomInt(2022, 2024), getRandomInt(0, 11), getRandomInt(1, 28))),
    category: getRandomElement(expenseCategories),
    vendorName: Math.random() > 0.5 ? `${getRandomElement(['Quick', 'Reliable', 'Best'])} Services` : undefined,
    invoiceNumber: `EXP-${Math.random().toString(36).substring(7)}`,
    receiptUrl: Math.random() > 0.6 ? `https://docs.example.com/receipt_${Math.random().toString(36).substring(7)}.pdf` : undefined,
    isRecurring,
    notes: `Expense for ${isRecurring ? 'recurring service' : 'one-off event'}.`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

const contractorServiceCategories = ['Plumbing', 'Electrical', 'General Maintenance', 'HVAC', 'Cleaning', 'Landscaping', 'Security'];
const generateContractor = (ownerId) => ({
  ownerId,
  companyName: `${getRandomElement(['Reliable', 'QuickFix', 'Elite', 'Pro'])} ${getRandomElement(['Services', 'Solutions', 'Co.'])}`,
  contactPersonName: `${getRandomElement(['Michael', 'Sarah', 'James', 'Emily'])} ${getRandomElement(['Davis', 'Wilson', 'Taylor'])}`,
  email: `contact${getRandomInt(100, 999)}@example.com`,
  phoneNumber: `+2547${getRandomInt(10000000, 99999999)}`,
  serviceCategories: [getRandomElement(contractorServiceCategories), Math.random() > 0.5 ? getRandomElement(contractorServiceCategories) : undefined].filter(Boolean),
  address: Math.random() > 0.5 ? generateAddress() : undefined,
  notes: 'Reliable and responsive.',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const maintenanceStatuses = ['New', 'Assigned', 'In Progress', 'Completed', 'Canceled'];
const maintenancePriorities = ['Low', 'Medium', 'High', 'Urgent'];
const generateMaintenanceRequest = (ownerId, propertyId, tenancyId, contractorId) => {
  const status = getRandomElement(maintenanceStatuses);
  const reportedDate = new Date(getRandomInt(2023, 2024), getRandomInt(0, 11), getRandomInt(1, 28));
  let scheduledDate = undefined;
  let completedDate = undefined;
  let cost = undefined;

  if (status === 'Assigned' || status === 'In Progress' || status === 'Completed') {
    scheduledDate = new Date(reportedDate.getTime() + getRandomInt(1, 7) * 24 * 60 * 60 * 1000);
  }
  if (status === 'Completed') {
    completedDate = new Date(scheduledDate.getTime() + getRandomInt(1, 14) * 24 * 60 * 60 * 1000);
    cost = parseFloat(getRandomFloat(1000, 20000));
  }

  return {
    ownerId,
    propertyId,
    tenancyId: Math.random() > 0.5 ? tenancyId : undefined,
    reportedBy: getRandomElement(['Tenant', 'Owner']),
    description: getRandomElement([
      'Leaky faucet in kitchen', 'Broken window pane', 'Clogged toilet',
      'Electrical outlet not working', 'Repaint living room'
    ]),
    priority: getRandomElement(maintenancePriorities),
    status,
    assignedToContractorId: status !== 'New' && Math.random() > 0.3 ? contractorId : undefined,
    scheduledDate: scheduledDate ? toTimestamp(scheduledDate) : undefined,
    completedDate: completedDate ? toTimestamp(completedDate) : undefined,
    cost,
    notes: 'Follow up needed.',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

const generateAppDocument = (ownerId, associatedEntityId, associatedEntityType) => ({
  ownerId,
  documentName: getRandomElement(['Lease Agreement', 'Receipt', 'ID Scan', 'Property Report', 'Tenant Application']),
  documentUrl: `https://storage.example.com/${associatedEntityType || 'general'}/${associatedEntityId || Math.random().toString(36).substring(7)}.pdf`,
  type: getRandomElement(['Lease Agreement', 'Receipt', 'ID Scan', 'Report', 'Other']),
  associatedEntityId,
  associatedEntityType,
  uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
  notes: 'Important document.',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const generateAppUser = (uid, email) => ({
  id: uid,
  email,
  displayName: `${getRandomElement(['Seeder', 'Test'])} User`,
  firstName: getRandomElement(['Seeder', 'Test']),
  lastName: 'User',
  phoneNumber: `+2547${getRandomInt(10000000, 99999999)}`,
  profileImageUrl: `https://example.com/profiles/${uid}.jpg`,
  role: 'Landlord',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const generateUserSettings = (ownerId) => ({
  id: ownerId,
  ownerId,
  currency: 'KES',
  dateFormat: 'DD/MM/YYYY',
  companyName: 'PropTraka Investments',
  theme: 'dark',
  emailNotificationsEnabled: true,
  documentTemplates: {
    leaseAgreement: 'https://docs.example.com/template_lease.docx',
    applicationForm: 'https://docs.example.com/template_application.pdf',
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});


// --- CLEAR EXISTING DATA ---
async function clearCollection(collectionRef, ownerId) {
    const q = collectionRef.where('ownerId', '==', ownerId);
    const snapshot = await q.get();
    if (snapshot.empty) {
        console.log(`No documents found in ${collectionRef.id} for ownerId: ${ownerId} to delete.`);
        return;
    }
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cleared ${snapshot.size} documents from ${collectionRef.id} for ownerId: ${ownerId}.`);
}

async function clearAllData(ownerId) {
    console.log(`\nClearing existing data for ownerId: ${ownerId}...`);
    const collectionsToClear = [
        db.collection('properties'),
        db.collection('tenants'),
        db.collection('tenancies'),
        db.collection('revenue'),
        db.collection('expenses'),
        db.collection('contractors'),
        db.collection('maintenanceRequests'),
        db.collection('appDocuments'),
        db.collection('userSettings'),
        // Note: appUsers is generally managed by Firebase Auth, and if you have a separate collection
        // it might not have ownerId. Be careful clearing appUsers.
    ];

    for (const colRef of collectionsToClear) {
        await clearCollection(colRef, ownerId);
    }
    console.log('All specified collections cleared.\n');
}


// --- SEED DATA ---
async function seedData(ownerId) {
  const batch = db.batch();
  const now = admin.firestore.Timestamp.now();

  console.log(`Seeding data for ownerId: ${ownerId}...\n`);

  console.log('Step 1: Seeding User and Settings...');
  const appUserRef = db.collection('appUsers').doc(ownerId);
  batch.set(appUserRef, generateAppUser(ownerId, 'owner@example.com'));
  
  const userSettingsRef = db.collection('userSettings').doc(ownerId);
  batch.set(userSettingsRef, generateUserSettings(ownerId));

  console.log('Step 2: Seeding Contractors...');
  const contractors = [];
  for (let i = 0; i < 6; i++) {
    const contractorRef = db.collection('contractors').doc();
    const contractorData = { ...generateContractor(ownerId), id: contractorRef.id };
    batch.set(contractorRef, contractorData);
    contractors.push(contractorData);
  }

  console.log('Step 3: Seeding Properties...');
  const properties = [];
  for (let i = 0; i < 5; i++) {
    const propertyRef = db.collection('properties').doc();
    const propertyData = { ...generateProperty(ownerId, `Prop${i + 1}`), id: propertyRef.id };
    batch.set(propertyRef, propertyData);
    properties.push(propertyData);
  }

  console.log('Step 4: Seeding Tenants...');
  const tenants = [];
  for (let i = 0; i < 8; i++) {
    const tenantRef = db.collection('tenants').doc();
    const tenantData = { ...generateTenant(ownerId), id: tenantRef.id };
    batch.set(tenantRef, tenantData);
    tenants.push(tenantData);
  }

  console.log('Step 5: Seeding Tenancies and Revenue Transactions...');
  const tenancies = [];
  const revenueTransactions = [];

  // Active Tenancy 1 (Property 1, Tenant 1)
  const tenancy1_startDate = new Date(2023, 0, 15); // Jan 15, 2023
  const tenancy1_endDate = new Date(2024, 11, 14); // Dec 14, 2024
  const tenancy1_rentAmount = properties[0].targetRent;
  const tenancy1_depositAmount = tenancy1_rentAmount * 1.5;
  const tenancy1_serviceChargeAmount = 2500;

  const tenancyRef1 = db.collection('tenancies').doc();
  const tenancyData1 = {
    ...generateTenancy(ownerId, properties[0].id, tenants[0].id, 'Active'),
    id: tenancyRef1.id,
    startDate: toTimestamp(tenancy1_startDate),
    endDate: toTimestamp(tenancy1_endDate),
    rentAmount: tenancy1_rentAmount,
    depositAmount: tenancy1_depositAmount,
    serviceChargeAmount: tenancy1_serviceChargeAmount,
    paymentFrequency: 'Monthly',
  };
  batch.set(tenancyRef1, tenancyData1);
  tenancies.push(tenancyData1);

  // Generate monthly rent and service charge transactions for Tenancy 1
  let currentTxDate = new Date(tenancy1_startDate.getFullYear(), tenancy1_startDate.getMonth(), 1); // Start from the 1st of the tenancy start month
  while (currentTxDate <= tenancy1_endDate) {
    const rentDueDate = new Date(currentTxDate.getFullYear(), currentTxDate.getMonth(), 1); // Rent due 1st of month
    
    // Rent Transaction
    const rentTxRef = db.collection('revenue').doc();
    const rentTxData = {
      ...generateRevenueTransaction(ownerId, tenancyRef1.id, properties[0].id, tenants[0].id, rentDueDate, 'Rent', tenancy1_rentAmount, getRandomElement(['Paid', 'Paid', 'Overdue'])),
      id: rentTxRef.id,
    };
    batch.set(rentTxRef, rentTxData);
    revenueTransactions.push(rentTxData);

    // Service Charge Transaction
    if (tenancy1_serviceChargeAmount) {
      const scTxRef = db.collection('revenue').doc();
      const scTxData = {
        ...generateRevenueTransaction(ownerId, tenancyRef1.id, properties[0].id, tenants[0].id, rentDueDate, 'Service Charge', tenancy1_serviceChargeAmount, getRandomElement(['Paid', 'Paid', 'Overdue'])),
        id: scTxRef.id,
        notes: 'Monthly Service Charge',
      };
      batch.set(scTxRef, scTxData);
      revenueTransactions.push(scTxData);
    }

    currentTxDate.setMonth(currentTxDate.getMonth() + 1);
  }


  // Terminated Tenancy 2 (Property 1, Tenant 2)
  const tenancy2_startDate = new Date(2022, 5, 1); // June 1, 2022
  const tenancy2_endDate = new Date(2023, 4, 31); // May 31, 2023 (Terminated early)
  const tenancy2_rentAmount = properties[0].targetRent * 0.9;

  const tenancyRef2 = db.collection('tenancies').doc();
  const tenancyData2 = {
    ...generateTenancy(ownerId, properties[0].id, tenants[1].id, 'Ended'),
    id: tenancyRef2.id,
    startDate: toTimestamp(tenancy2_startDate),
    endDate: toTimestamp(tenancy2_endDate),
    rentAmount: tenancy2_rentAmount,
    depositAmount: tenancy2_rentAmount,
    paymentFrequency: 'Monthly',
  };
  batch.set(tenancyRef2, tenancyData2);
  tenancies.push(tenancyData2);

   // Active Tenancy 3 (Property 2, Tenant 3)
   const tenancy3_startDate = new Date(2023, 8, 1); // Sep 1, 2023
   const tenancy3_endDate = new Date(2024, 8, 31); // Sep 31, 2024
   const tenancy3_rentAmount = properties[1].targetRent;
   const tenancy3_depositAmount = tenancy3_rentAmount;
 
   const tenancyRef3 = db.collection('tenancies').doc();
   const tenancyData3 = {
     ...generateTenancy(ownerId, properties[1].id, tenants[2].id, 'Active'),
     id: tenancyRef3.id,
     startDate: toTimestamp(tenancy3_startDate),
     endDate: toTimestamp(tenancy3_endDate),
     rentAmount: tenancy3_rentAmount,
     depositAmount: tenancy3_depositAmount,
     paymentFrequency: 'Monthly',
   };
   batch.set(tenancyRef3, tenancyData3);
   tenancies.push(tenancyData3);

    // Active Tenancy 4 (Property 3, Tenant 4)
    const tenancy4_startDate = new Date(2024, 0, 1); // Jan 1, 2024
    const tenancy4_endDate = new Date(2025, 0, 31); // Jan 31, 2025
    const tenancy4_rentAmount = properties[2].targetRent;
    const tenancy4_depositAmount = tenancy4_rentAmount;

    const tenancyRef4 = db.collection('tenancies').doc();
    const tenancyData4 = {
        ...generateTenancy(ownerId, properties[2].id, tenants[3].id, 'Active'),
        id: tenancyRef4.id,
        startDate: toTimestamp(tenancy4_startDate),
        endDate: toTimestamp(tenancy4_endDate),
        rentAmount: tenancy4_rentAmount,
        depositAmount: tenancy4_depositAmount,
        paymentFrequency: 'Quarterly', // Example: quarterly
    };
    batch.set(tenancyRef4, tenancyData4);
    tenancies.push(tenancyData4);


  console.log('Step 6: Seeding Expenses...');
  const expenses = [];
  for (let i = 0; i < 10; i++) {
    const expenseRef = db.collection('expenses').doc();
    const expenseData = {
      ...generateExpense(ownerId, properties[getRandomInt(0, properties.length - 1)].id, contractors[getRandomInt(0, contractors.length - 1)].id),
      id: expenseRef.id,
    };
    batch.set(expenseRef, expenseData);
    expenses.push(expenseData);
  }

  console.log('Step 7: Seeding Maintenance Requests...');
  const maintenanceRequests = [];
  for (let i = 0; i < 5; i++) {
    const mrRef = db.collection('maintenanceRequests').doc();
    const mrData = {
      ...generateMaintenanceRequest(
        ownerId,
        properties[getRandomInt(0, properties.length - 1)].id,
        tenancies[getRandomInt(0, tenancies.length - 1)].id,
        contractors[getRandomInt(0, contractors.length - 1)].id
      ),
      id: mrRef.id,
    };
    batch.set(mrRef, mrData);
    maintenanceRequests.push(mrData);
  }

  console.log('Step 8: Seeding App Documents...');
  const appDocuments = [];

  // Document for Property 1
  const docRef1 = db.collection('appDocuments').doc();
  const docData1 = {
    ...generateAppDocument(ownerId, properties[0].id, 'property'),
    id: docRef1.id,
    documentName: 'Property Deed - Greenview',
    type: 'Other',
  };
  batch.set(docRef1, docData1);
  appDocuments.push(docData1);

  // Document for Tenant 1 (ID Scan)
  const docRef2 = db.collection('appDocuments').doc();
  const docData2 = {
    ...generateAppDocument(ownerId, tenants[0].id, 'tenant'),
    id: docRef2.id,
    documentName: 'Tenant ID Scan - Alice Smith',
    type: 'ID Scan',
  };
  batch.set(docRef2, docData2);
  appDocuments.push(docData2);

  // Document for Tenancy 1 (Lease Agreement)
  const docRef3 = db.collection('appDocuments').doc();
  const docData3 = {
    ...generateAppDocument(ownerId, tenancies[0].id, 'tenancy'),
    id: docRef3.id,
    documentName: 'Lease Agreement - Tenancy 1',
    type: 'Lease Agreement',
  };
  batch.set(docRef3, docData3);
  appDocuments.push(docData3);

  // Document for an Expense (Receipt)
  if (expenses.length > 0) {
    const docRef4 = db.collection('appDocuments').doc();
    const docData4 = {
      ...generateAppDocument(ownerId, expenses[0].id, 'expense'),
      id: docRef4.id,
      documentName: 'Expense Receipt - Plumbing',
      type: 'Receipt',
    };
    batch.set(docRef4, docData4);
    appDocuments.push(docData4);
  }


  console.log('Committing batch...');
  await batch.commit();
  console.log('Firestore seeding complete!');
  console.log(`Seeded ${properties.length} properties, ${tenants.length} tenants, ${tenancies.length} tenancies, ${revenueTransactions.length} revenue transactions, ${expenses.length} expenses, ${contractors.length} contractors, ${maintenanceRequests.length} maintenance requests, ${appDocuments.length} app documents, and 1 user + settings.`);
}

// --- EXECUTION ---
(async () => {
  try {
    // Optional: Clear existing data for the owner before seeding
    // Uncomment the line below if you want to clear data before seeding
    await clearAllData(OWNER_UID);

    await seedData(OWNER_UID);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
})();
