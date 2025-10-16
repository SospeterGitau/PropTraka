
'use client';

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Property, Transaction, CalendarEvent, ResidencyStatus, ChangeLogEntry, MaintenanceRequest } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import {
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';


interface DataContextType {
  properties: Property[] | null;
  addProperty: (property: Omit<Property, 'id' | 'ownerId'>) => Promise<void>;
  updateProperty: (property: Property) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  
  revenue: Transaction[] | null;
  addTenancy: (transactions: Omit<Transaction, 'id' | 'ownerId'>[]) => Promise<void>;
  updateTenancy: (transactions: Transaction[]) => Promise<void>;
  deleteTenancy: (tenancyId: string) => Promise<void>;
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
  user: any, 
  existingProperties: number,
  existingRevenue: number,
  existingExpenses: number,
  existingMaintenance: number
) {
  const shouldSeed = 
    existingProperties === 0 &&
    existingRevenue === 0 &&
    existingExpenses === 0 &&
    existingMaintenance === 0;

  if (!shouldSeed) {
    console.log("Data exists, skipping seed.");
    return;
  }
  console.log("No data found. Seeding database...");

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
  
  const propertyDocs = propertiesToCreate.map(p => {
    const docRef = doc(collection(firestore, 'users', user.uid, 'properties'));
    batch.set(docRef, { ...p, ownerId: user.uid });
    return { ...p, id: docRef.id };
  });

  // 2. Tenancies (Revenue)
  const tenancy1Id = `t${Date.now()}`;
  const startDate1 = new Date();
  startDate1.setMonth(startDate1.getMonth() - 4);
  const endDate1 = new Date(startDate1);
  endDate1.setFullYear(endDate1.getFullYear() + 1);

  for (let i = 0; i < 12; i++) {
    const dueDate = new Date(startDate1);
    dueDate.setMonth(startDate1.getMonth() + i);
    const revDocRef = doc(collection(firestore, 'users', user.uid, 'revenue'));
    batch.set(revDocRef, {
      tenancyId: tenancy1Id,
      date: dueDate.toISOString().split('T')[0],
      amount: 120000, amountPaid: i < 4 ? 120000 : 0, // Pay first 4 months
      propertyId: propertyDocs[0].id, propertyName: `${propertyDocs[0].addressLine1}, ${propertyDocs[0].city}`,
      tenant: 'Alice Johnson', tenantEmail: 'alice@example.com', type: 'revenue',
      deposit: i === 0 ? 120000 : 0, ownerId: user.uid,
      tenancyStartDate: startDate1.toISOString().split('T')[0],
      tenancyEndDate: endDate1.toISOString().split('T')[0],
    });
  }

  // 3. Expenses
  const expensesToCreate = [
    { date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], amount: 15000, propertyId: propertyDocs[0].id, propertyName: `${propertyDocs[0].addressLine1}, ${propertyDocs[0].city}`, category: 'Maintenance', vendor: 'FixIt Bros', expenseType: 'one-off' },
    { date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0], amount: 5000, propertyId: propertyDocs[1].id, propertyName: `${propertyDocs[1].addressLine1}, ${propertyDocs[1].city}`, category: 'Repairs', vendor: 'PlumbPerfect', expenseType: 'one-off' },
    { date: new Date().toISOString().split('T')[0], amount: 25000, category: 'Insurance', propertyName: 'General Expense', vendor: 'InsuCo', expenseType: 'recurring', frequency: 'yearly' },
  ];

  expensesToCreate.forEach(e => {
    const expDocRef = doc(collection(firestore, 'users', user.uid, 'expenses'));
    batch.set(expDocRef, { ...e, ownerId: user.uid, type: 'expense' });
  });

  // 4. Maintenance Requests
  const maintenanceToCreate = [
    { propertyId: propertyDocs[0].id, propertyName: `${propertyDocs[0].addressLine1}, ${propertyDocs[0].city}`, description: 'Fix leaking kitchen sink', status: 'Done', priority: 'High', reportedDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], completedDate: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString().split('T')[0] },
    { propertyId: propertyDocs[1].id, propertyName: `${propertyDocs[1].addressLine1}, ${propertyDocs[1].city}`, description: 'Repaint bedroom walls', status: 'In Progress', priority: 'Medium', reportedDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0] },
    { propertyName: 'General Task', description: 'Annual fire safety inspection for all properties', status: 'To Do', priority: 'Medium', reportedDate: new Date().toISOString().split('T')[0] },
  ];

  maintenanceToCreate.forEach(m => {
    const maintDocRef = doc(collection(firestore, 'users', user.uid, 'maintenanceRequests'));
    batch.set(maintDocRef, { ...m, ownerId: user.uid });
  });

  await batch.commit();
  console.log("Database seeded successfully.");
}

export function DataProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user } = useUser();

  // Firestore collections
  const propertiesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'properties') : null, [firestore, user]);
  const revenueRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'revenue') : null, [firestore, user]);
  const expensesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'expenses') : null, [firestore, user]);
  const maintenanceRequestsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'maintenanceRequests') : null, [firestore, user]);
  const changelogRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'changelog') : null, [firestore, user]);

  const { data: properties, isLoading: loadingProperties } = useCollection<Property>(propertiesRef);
  const { data: revenue, isLoading: loadingRevenue } = useCollection<Transaction>(revenueRef);
  const { data: expenses, isLoading: loadingExpenses } = useCollection<Transaction>(expensesRef);
  const { data: maintenanceRequests, isLoading: loadingMaintenance } = useCollection<MaintenanceRequest>(maintenanceRequestsRef);
  const { data: changelog, isLoading: loadingChangelog } = useCollection<ChangeLogEntry>(changelogRef, {
    sortField: 'date',
    sortDirection: 'desc',
  });

  const isDataLoading = loadingProperties || loadingRevenue || loadingExpenses || loadingChangelog || loadingMaintenance;

  const [currency, setCurrency] = useState('KES');
  const [locale, setLocale] = useState('en-GB');
  const [companyName, setCompanyName] = useState('RentVision Ltd');
  const [residencyStatus, setResidencyStatus] = useState<ResidencyStatus>('non-resident');
  const [isPnlReportEnabled, setIsPnlReportEnabled] = useState(true);
  const [isMarketResearchEnabled, setIsMarketResearchEnabled] = useState(true);

  // --- DATA SEEDING EFFECT ---
  useEffect(() => {
    // Only run this effect when all data sources have finished loading and we have a user.
    if (!isDataLoading && firestore && user && properties !== null && revenue !== null && expenses !== null && maintenanceRequests !== null) {
      seedDatabase(
        firestore,
        user,
        properties.length,
        revenue.length,
        expenses.length,
        maintenanceRequests.length
      );
    }
  }, [isDataLoading, firestore, user, properties, revenue, expenses, maintenanceRequests]);

  // --- MUTATION FUNCTIONS ---

  const addChangeLogEntry = async (entry: Omit<ChangeLogEntry, 'id' | 'date' | 'ownerId'>) => {
    if (!changelogRef || !user) return;
    const newEntry = {
      ...entry,
      date: new Date().toISOString(),
      ownerId: user.uid,
    };
    await addDocumentNonBlocking(changelogRef, newEntry);
  };

  // Properties
  const addProperty = async (property: Omit<Property, 'id' | 'ownerId'>) => {
    if (!propertiesRef || !user) return;
    const newProperty = { ...property, ownerId: user.uid };
    await addDocumentNonBlocking(propertiesRef, newProperty);
  };
  const updateProperty = async (property: Property) => {
    if (!user) return;
    const propDocRef = doc(firestore, 'users', user.uid, 'properties', property.id);
    updateDocumentNonBlocking(propDocRef, property);
  };
  const deleteProperty = async (propertyId: string) => {
    if (!user) return;
    const propDocRef = doc(firestore, 'users', user.uid, 'properties', propertyId);
    deleteDocumentNonBlocking(propDocRef);
  };

  // Tenancy (Revenue)
  const addTenancy = async (transactions: Omit<Transaction, 'id' | 'ownerId'>[]) => {
    if (!user) return;
    const batch = writeBatch(firestore);
    transactions.forEach(tx => {
      const txDocRef = doc(collection(firestore, 'users', user.uid, 'revenue'));
      batch.set(txDocRef, {...tx, ownerId: user.uid});
    });
    await batch.commit();
  };
  const updateTenancy = async (transactions: Transaction[]) => {
     if (!user) return;
    const batch = writeBatch(firestore);
    transactions.forEach(tx => {
      const txDocRef = doc(firestore, 'users', user.uid, 'revenue', tx.id);
      batch.set(txDocRef, {...tx, ownerId: user.uid}, { merge: true });
    });
    await batch.commit();
  };
  const deleteTenancy = async (tenancyId: string) => {
    if (!user || !revenue) return;
    const q = query(revenueRef!, where('tenancyId', '==', tenancyId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    querySnapshot.forEach((doc) => {
       batch.delete(doc.ref);
    });
    await batch.commit();
  };
   const updateRevenueTransaction = async (transaction: Transaction) => {
    if (!user) return;
    const txDocRef = doc(firestore, 'users', user.uid, 'revenue', transaction.id);
    updateDocumentNonBlocking(txDocRef, transaction);
  };

  // Expenses
  const addExpense = async (expense: Omit<Transaction, 'id'|'type'|'ownerId'>) => {
    if (!expensesRef || !user) return;
    const newExpense = { ...expense, ownerId: user.uid, type: 'expense' as const };
    await addDocumentNonBlocking(expensesRef, newExpense);
  };
  const updateExpense = async (expense: Transaction) => {
    if (!user) return;
    const expDocRef = doc(firestore, 'users', user.uid, 'expenses', expense.id);
    updateDocumentNonBlocking(expDocRef, expense);
  };
  const deleteExpense = async (expenseId: string) => {
    if (!user) return;
    const expDocRef = doc(firestore, 'users', user.uid, 'expenses', expenseId);
    deleteDocumentNonBlocking(expDocRef);
  };

  // Maintenance
  const addMaintenanceRequest = async (request: Omit<MaintenanceRequest, 'id'|'ownerId'>) => {
    if (!maintenanceRequestsRef || !user) return;
    const newRequest = { ...request, ownerId: user.uid };
    await addDocumentNonBlocking(maintenanceRequestsRef, newRequest);
  };
  const updateMaintenanceRequest = async (request: MaintenanceRequest) => {
    if (!user) return;
    const reqDocRef = doc(firestore, 'users', user.uid, 'maintenanceRequests', request.id);
    updateDocumentNonBlocking(reqDocRef, request);
  };
  const deleteMaintenanceRequest = async (requestId: string) => {
    if (!user) return;
    const reqDocRef = doc(firestore, 'users', user.uid, 'maintenanceRequests', requestId);
    deleteDocumentNonBlocking(reqDocRef);
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
    addTenancy, updateTenancy, deleteTenancy, updateRevenueTransaction,
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

    