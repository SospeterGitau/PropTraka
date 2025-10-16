
'use client';

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Property, Transaction, CalendarEvent, ResidencyStatus, ChangeLogEntry, MaintenanceRequest } from '@/lib/types';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch, query, where, getDocs, addDoc } from 'firebase/firestore';
import { isAfter, format } from 'date-fns';


interface DataContextType {
  properties: Property[] | null;
  addProperty: (property: Omit<Property, 'id' | 'ownerId'>) => Promise<void>;
  updateProperty: (property: Property) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  
  revenue: Transaction[] | null;
  addTenancy: (transactions: Omit<Transaction, 'id' | 'ownerId'>[]) => Promise<void>;
  updateTenancy: (transactions: Transaction[]) => Promise<void>;
  deleteTenancy: (tenancyId: string) => Promise<void>;
  endTenancy: (tenancyId: string, newEndDate: Date) => Promise<void>;
  updateRevenueTransaction: (transaction: Transaction) => Promise<void>;

  expenses: Transaction[] | null;
  addExpense: (expense: Omit<Transaction, 'id'|'type'|'ownerId'>) => Promise<void>;
  updateExpense: (expense: Transaction) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;

  maintenanceRequests: MaintenanceRequest[] | null;
  addMaintenanceRequest: (request: Omit<MaintenanceRequest, 'id' | 'ownerId'>) => Promise<void>;
  updateMaintenanceRequest: (request: MaintenanceRequest) => Promise<void>;
  deleteMaintenanceRequest: (requestId: string) => Promise<void>;

  changelog: ChangeLogEntry[] | null;
  addChangeLogEntry: (entry: Omit<ChangeLogEntry, 'id' | 'date'|'ownerId'>) => void;
  
  calendarEvents: CalendarEvent[];
  currency: string;
  setCurrency: (currency: string) => void;
  locale: string;
  setLocale: (locale: string) => void;
  companyName: string;
  setCompanyName: (companyName: string) => void;
  residencyStatus: ResidencyStatus;
  setResidencyStatus: (status: ResidencyStatus) => void;
  isPnlReportEnabled: boolean;
  setIsPnlReportEnabled: (enabled: boolean) => void;
  isMarketResearchEnabled: boolean;
  setIsMarketResearchEnabled: (enabled: boolean) => void;
  formatCurrency: (amount: number) => string;
  formatCurrencyForAxis: (amount: number) => string;
  isDataLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Sample Data Seeding ---
async function seedDatabase(
  firestore: any, 
  user: any
) {
  console.log("Seeding database for user:", user.uid);

  const batch = writeBatch(firestore);

  // 1. Properties
  const propertiesToCreate: Omit<Property, 'id' | 'ownerId'>[] = [
    {
      addressLine1: '456 Oak Avenue', city: 'Nairobi', state: 'Nairobi', postalCode: '00200',
      propertyType: 'Domestic', buildingType: 'Detached House', bedrooms: 4, bathrooms: 3, size: 250, sizeUnit: 'sqm',
      purchasePrice: 20000000, mortgage: 15000000, currentValue: 22000000, rentalValue: 120000, purchaseTaxes: 800000,
      imageUrl: 'https://picsum.photos/seed/p1/600/400', imageHint: 'detached house'
    },
    {
      addressLine1: '789 Pine Lane', city: 'Mombasa', state: 'Mombasa', postalCode: '80100',
      propertyType: 'Domestic', buildingType: 'Flat', bedrooms: 2, bathrooms: 1, size: 80, sizeUnit: 'sqm',
      purchasePrice: 8000000, mortgage: 6000000, currentValue: 9000000, rentalValue: 50000, purchaseTaxes: 320000,
      imageUrl: 'https://picsum.photos/seed/p2/600/400', imageHint: 'apartment flat'
    },
    {
      addressLine1: '101 Biashara St', city: 'Nairobi', state: 'Nairobi', postalCode: '00100',
      propertyType: 'Commercial', buildingType: 'Office', bedrooms: 0, bathrooms: 2, size: 500, sizeUnit: 'sqm',
      purchasePrice: 30000000, mortgage: 20000000, currentValue: 35000000, rentalValue: 250000, purchaseTaxes: 1200000,
      imageUrl: 'https://picsum.photos/seed/p3/600/400', imageHint: 'commercial office'
    }
  ];
  
  const propertiesCollectionRef = collection(firestore, 'users', user.uid, 'properties');
  const propertyDocsData = await Promise.all(propertiesToCreate.map(async (p) => {
    const docRef = doc(propertiesCollectionRef);
    batch.set(docRef, { ...p, ownerId: user.uid });
    return { ...p, id: docRef.id };
  }));

  // 2. Tenancies (Revenue)
  const revenueCollectionRef = collection(firestore, 'users', user.uid, 'revenue');
  const tenancy1Id = `t${Date.now()}`;
  const startDate1 = new Date();
  startDate1.setMonth(startDate1.getMonth() - 4);
  const endDate1 = new Date(startDate1);
  endDate1.setFullYear(endDate1.getFullYear() + 1);

  for (let i = 0; i < 12; i++) {
    const dueDate = new Date(startDate1);
    dueDate.setMonth(startDate1.getMonth() + i);
    const revDocRef = doc(revenueCollectionRef);
    batch.set(revDocRef, {
      tenancyId: tenancy1Id,
      date: dueDate.toISOString().split('T')[0],
      amount: 120000, amountPaid: i < 4 ? 120000 : 0, // Pay first 4 months
      propertyId: propertyDocsData[0].id, propertyName: `${propertyDocsData[0].addressLine1}, ${propertyDocsData[0].city}`,
      tenant: 'Alice Johnson', tenantEmail: 'alice@example.com', type: 'revenue',
      deposit: i === 0 ? 120000 : 0, ownerId: user.uid,
      tenancyStartDate: startDate1.toISOString().split('T')[0],
      tenancyEndDate: endDate1.toISOString().split('T')[0],
    });
  }

  // 3. Expenses
  const expensesCollectionRef = collection(firestore, 'users', user.uid, 'expenses');
  const expensesToCreate = [
    { date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], amount: 15000, propertyId: propertyDocsData[0].id, propertyName: `${propertyDocsData[0].addressLine1}, ${propertyDocsData[0].city}`, category: 'Maintenance', vendor: 'FixIt Bros', expenseType: 'one-off' },
    { date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0], amount: 5000, propertyId: propertyDocsData[1].id, propertyName: `${propertyDocsData[1].addressLine1}, ${propertyDocsData[1].city}`, category: 'Repairs', vendor: 'PlumbPerfect', expenseType: 'one-off' },
    { date: new Date().toISOString().split('T')[0], amount: 25000, category: 'Insurance', propertyName: 'General Expense', vendor: 'InsuCo', expenseType: 'recurring', frequency: 'yearly' },
  ];

  expensesToCreate.forEach(e => {
    const expDocRef = doc(expensesCollectionRef);
    batch.set(expDocRef, { ...e, ownerId: user.uid, type: 'expense' });
  });

  // 4. Maintenance Requests
  const maintenanceCollectionRef = collection(firestore, 'users', user.uid, 'maintenanceRequests');
  const maintenanceToCreate = [
    { propertyId: propertyDocsData[0].id, propertyName: `${propertyDocsData[0].addressLine1}, ${propertyDocsData[0].city}`, description: 'Fix leaking kitchen sink', status: 'Done', priority: 'High', reportedDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], completedDate: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString().split('T')[0] },
    { propertyId: propertyDocsData[1].id, propertyName: `${propertyDocsData[1].addressLine1}, ${propertyDocsData[1].city}`, description: 'Repaint bedroom walls', status: 'In Progress', priority: 'Medium', reportedDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0] },
    { propertyName: 'General Business Task', description: 'Annual fire safety inspection for all properties', status: 'To Do', priority: 'Medium', reportedDate: new Date().toISOString().split('T')[0] },
  ];

  maintenanceToCreate.forEach(m => {
    const maintDocRef = doc(maintenanceCollectionRef);
    batch.set(maintDocRef, { ...m, ownerId: user.uid });
  });

  await batch.commit();
  console.log("Database seeded successfully.");
}

export function DataProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  // Firestore collection references that depend on the user
  const propertiesRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'properties') : null, [firestore, user]);
  const revenueRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'revenue') : null, [firestore, user]);
  const expensesRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'expenses') : null, [firestore, user]);
  const maintenanceRequestsRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'maintenanceRequests') : null, [firestore, user]);
  const changelogRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'changelog') : null, [firestore, user]);

  const { data: properties, isLoading: loadingProperties } = useCollection<Property>(propertiesRef);
  const { data: revenue, isLoading: loadingRevenue } = useCollection<Transaction>(revenueRef);
  const { data: expenses, isLoading: loadingExpenses } = useCollection<Transaction>(expensesRef);
  const { data: maintenanceRequests, isLoading: loadingMaintenance } = useCollection<MaintenanceRequest>(maintenanceRequestsRef);
  const { data: changelog, isLoading: loadingChangelog } = useCollection<ChangeLogEntry>(changelogRef, {
    sortField: 'date',
    sortDirection: 'desc',
  });
  
  // Overall data loading status
  const isDataLoading = isAuthLoading || loadingProperties || loadingRevenue || loadingExpenses || loadingChangelog || loadingMaintenance;

  const [currency, setCurrency] = useState('KES');
  const [locale, setLocale] = useState('en-GB');
  const [companyName, setCompanyName] = useState('RentVision Ltd');
  const [residencyStatus, setResidencyStatus] = useState<ResidencyStatus>('non-resident');
  const [isPnlReportEnabled, setIsPnlReportEnabled] = useState(true);
  const [isMarketResearchEnabled, setIsMarketResearchEnabled] = useState(true);

  // --- DATA SEEDING EFFECT ---
  useEffect(() => {
    // Only proceed if we are done authenticating and have a user, and Firestore is available.
    if (!isAuthLoading && user && firestore) {
      // Check if all data collections have finished loading.
      const allCollectionsLoaded = !loadingProperties && !loadingRevenue && !loadingExpenses && !loadingMaintenance;
      
      if (allCollectionsLoaded) {
        const shouldSeed = 
            properties?.length === 0 &&
            revenue?.length === 0 &&
            expenses?.length === 0 &&
            maintenanceRequests?.length === 0;

        if (shouldSeed) {
            seedDatabase(firestore, user);
        }
      }
    }
  }, [isAuthLoading, user, firestore, properties, revenue, expenses, maintenanceRequests, loadingProperties, loadingRevenue, loadingExpenses, loadingMaintenance]);

  // --- MUTATION FUNCTIONS ---

  const addChangeLogEntry = async (entry: Omit<ChangeLogEntry, 'id' | 'date' | 'ownerId'>) => {
    if (!changelogRef || !user) return;
    const newEntry = {
      ...entry,
      date: new Date().toISOString(),
      ownerId: user.uid,
    };
    await addDoc(changelogRef, newEntry);
  };

  // Properties
  const addProperty = async (property: Omit<Property, 'id' | 'ownerId'>) => {
    if (!propertiesRef || !user) return;
    const newProperty = { ...property, ownerId: user.uid };
    await addDoc(propertiesRef, newProperty);
  };
  const updateProperty = async (property: Property) => {
    if (!user) return;
    const propDocRef = doc(firestore, 'users', user.uid, 'properties', property.id);
    await setDoc(propDocRef, property, { merge: true });
  };
  const deleteProperty = async (propertyId: string) => {
    if (!user) return;
    const propDocRef = doc(firestore, 'users', user.uid, 'properties', propertyId);
    await deleteDoc(propDocRef);
  };

  // Tenancy (Revenue)
  const addTenancy = async (transactions: Omit<Transaction, 'id' | 'ownerId'>[]) => {
    if (!user || !revenueRef) return;
    const batch = writeBatch(firestore);
    transactions.forEach(tx => {
      const txDocRef = doc(revenueRef);
      batch.set(txDocRef, {...tx, ownerId: user.uid});
    });
    await batch.commit();
  };
  const updateTenancy = async (transactions: Transaction[]) => {
     if (!user || !revenueRef) return;
    const batch = writeBatch(firestore);

    // Get all existing transactions for this tenancy
    const q = query(revenueRef, where('tenancyId', '==', transactions[0].tenancyId));
    const querySnapshot = await getDocs(q);
    const newIds = new Set(transactions.filter(t => t.id).map(t => t.id));

    // Delete transactions that are no longer in the updated date range
    querySnapshot.forEach(docSnap => {
        if (!newIds.has(docSnap.id)) {
            batch.delete(docSnap.ref);
        }
    });

    transactions.forEach(tx => {
      const docRef = tx.id ? doc(revenueRef, tx.id) : doc(revenueRef);
      batch.set(docRef, {...tx, ownerId: user.uid}, { merge: true });
    });
    await batch.commit();
  };
  const deleteTenancy = async (tenancyId: string) => {
    if (!user || !revenueRef) return;
    const q = query(revenueRef, where('tenancyId', '==', tenancyId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    querySnapshot.forEach((doc) => {
       batch.delete(doc.ref);
    });
    await batch.commit();
  };

  const endTenancy = async (tenancyId: string, newEndDate: Date) => {
    if (!user || !revenueRef) return;

    const newEndDateStr = format(newEndDate, 'yyyy-MM-dd');
    const batch = writeBatch(firestore);
    
    // Query for all transactions of the tenancy
    const q = query(revenueRef, where('tenancyId', '==', tenancyId));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach(docSnap => {
        const tx = docSnap.data() as Transaction;
        const isFutureUnpaid = isAfter(new Date(tx.date), newEndDate) && (tx.amountPaid ?? 0) === 0;

        if (isFutureUnpaid) {
            // Delete future, unpaid records
            batch.delete(docSnap.ref);
        } else {
            // Update the end date for all remaining records
            batch.update(docSnap.ref, { tenancyEndDate: newEndDateStr });
        }
    });
    
    await batch.commit();
  };

  const updateRevenueTransaction = async (transaction: Transaction) => {
    if (!user) return;
    const txDocRef = doc(firestore, 'users', user.uid, 'revenue', transaction.id);
    await setDoc(txDocRef, transaction, { merge: true });
  };

  // Expenses
  const addExpense = async (expense: Omit<Transaction, 'id'|'type'|'ownerId'>) => {
    if (!expensesRef || !user) return;
    const newExpense = { ...expense, ownerId: user.uid, type: 'expense' as const };
    await addDoc(expensesRef, newExpense);
  };
  const updateExpense = async (expense: Transaction) => {
    if (!user) return;
    const expDocRef = doc(firestore, 'users', user.uid, 'expenses', expense.id);
    await setDoc(expDocRef, expense, { merge: true });
  };
  const deleteExpense = async (expenseId: string) => {
    if (!user) return;
    const expDocRef = doc(firestore, 'users', user.uid, 'expenses', expenseId);
    await deleteDoc(expDocRef);
  };

  // Maintenance
  const addMaintenanceRequest = async (request: Omit<MaintenanceRequest, 'id'|'ownerId'>) => {
    if (!maintenanceRequestsRef || !user) return;
    const newRequest = { ...request, ownerId: user.uid };
    await addDoc(maintenanceRequestsRef, newRequest);
  };
  const updateMaintenanceRequest = async (request: MaintenanceRequest) => {
    if (!user) return;
    const reqDocRef = doc(firestore, 'users', user.uid, 'maintenanceRequests', request.id);
    await setDoc(reqDocRef, request, { merge: true });
  };
  const deleteMaintenanceRequest = async (requestId: string) => {
    if (!user) return;
    const reqDocRef = doc(firestore, 'users', user.uid, 'maintenanceRequests', requestId);
    await deleteDoc(reqDocRef);
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatCurrencyForAxis = (amount: number) => {
    const symbol = new Intl.NumberFormat(locale, { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).formatToParts(0).find(p => p.type === 'currency')?.value || '';

    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}m`;
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}k`;
    }
    return formatCurrency(amount);
  };
  
  const formatCurrencyWithCents = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const calendarEvents = useMemo(() => {
    if (!revenue || !expenses) return [];

    const events: CalendarEvent[] = [];
    const processedTenancies = new Set<string>();

    revenue.forEach(item => {
       if (item.tenancyId && !processedTenancies.has(item.tenancyId)) {
        if (item.tenancyStartDate) {
          events.push({
            date: item.tenancyStartDate,
            title: `Start: ${item.tenant}`,
            type: 'tenancy-start',
            details: { Property: item.propertyName, Tenant: item.tenant }
          });
        }
        if (item.tenancyEndDate) {
          events.push({
            date: item.tenancyEndDate,
            title: `End: ${item.tenant}`,
            type: 'tenancy-end',
            details: { Property: item.propertyName, Tenant: item.tenant }
          });
        }
        processedTenancies.add(item.tenancyId);
       }
    });

    expenses.forEach(item => {
      events.push({
        date: item.date,
        title: `Expense: ${item.category}`,
        type: 'expense',
        details: {
            Property: item.propertyName,
            Category: item.category,
            Vendor: item.vendor,
            Amount: formatCurrencyWithCents(item.amount),
        }
      });
    });

    return events;
  }, [revenue, expenses, currency, locale]);

  const value = useMemo(() => ({
    properties,
    addProperty, updateProperty, deleteProperty,
    revenue,
    addTenancy, updateTenancy, deleteTenancy, endTenancy, updateRevenueTransaction,
    expenses,
    addExpense, updateExpense, deleteExpense,
    maintenanceRequests,
    addMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest,
    changelog,
    addChangeLogEntry,
    calendarEvents,
    currency, setCurrency,
    locale, setLocale,
    companyName, setCompanyName,
    residencyStatus, setResidencyStatus,
    isPnlReportEnabled, setIsPnlReportEnabled,
    isMarketResearchEnabled, setIsMarketResearchEnabled,
    formatCurrency,
    formatCurrencyForAxis,
    isDataLoading
  }), [
    properties, revenue, expenses, maintenanceRequests, changelog, calendarEvents,
    currency, locale, companyName, residencyStatus, isPnlReportEnabled,
    isMarketResearchEnabled, isDataLoading
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}
