
'use client';

/**
 * @fileoverview This file defines the primary data management context for the application.
 *
 * The `DataProvider` component is a crucial part of the app's architecture. It sits
 * just inside the main authentication layout and acts as the central hub for all
 * business data.
 *
 * It is responsible for:
 * 1. Using the `useUser` hook to get the currently authenticated user.
 * 2. Using the user's ID to construct and execute Firestore queries for all relevant
 *    data collections (properties, revenue, expenses, etc.) via the `useCollection` hook.
 * 3. Providing the fetched data (properties, revenue, etc.) and loading states to all
 *    child components through the `DataContext`.
 * 4. Exposing a set of memoized functions (`addProperty`, `deleteTenancy`, etc.) that
 *    allow child components to perform CRUD (Create, Read, Update, Delete) operations
 *    on the Firestore database.
 * 5. Handling local application state, such as currency and locale preferences.
 * 6. Implementing the one-time database seeding logic for new users.
 */

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Property, Transaction, CalendarEvent, ResidencyStatus, ChangeLogEntry, MaintenanceRequest, Contractor } from '@/lib/types';
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

  contractors: Contractor[] | null;
  addContractor: (contractor: Omit<Contractor, 'id' | 'ownerId'>) => Promise<void>;
  updateContractor: (contractor: Contractor) => Promise<void>;
  deleteContractor: (contractorId: string) => Promise<void>;

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
  
  const propertiesCollectionRef = collection(firestore, 'properties');
  const propertyDocsData = await Promise.all(propertiesToCreate.map(async (p) => {
    const docRef = doc(propertiesCollectionRef);
    batch.set(docRef, { ...p, ownerId: user.uid });
    return { ...p, id: docRef.id, ownerId: user.uid };
  }));

  // 2. Contractors
  const contractorsCollectionRef = collection(firestore, 'contractors');
  const contractorsToCreate = [
    { name: 'FixIt Bros', specialty: 'General Maintenance', email: 'contact@fixit.com', phone: '0712345678', ownerId: user.uid },
    { name: 'PlumbPerfect', specialty: 'Plumbing', email: 'hello@plumbperfect.co.ke', phone: '0787654321', ownerId: user.uid },
    { name: 'Sparky Electricals', specialty: 'Electrical', email: 'sparky@gmail.com', phone: '0711223344', ownerId: user.uid },
  ];
   const contractorDocsData = await Promise.all(contractorsToCreate.map(async (c) => {
    const docRef = doc(contractorsCollectionRef);
    batch.set(docRef, { ...c, ownerId: user.uid });
    return { ...c, id: docRef.id, ownerId: user.uid };
  }));

  // 3. Tenancies (Revenue)
  const revenueCollectionRef = collection(firestore, 'revenue');
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

  // 4. Expenses
  const expensesCollectionRef = collection(firestore, 'expenses');
  const expensesToCreate = [
    { date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], amount: 15000, propertyId: propertyDocsData[0].id, propertyName: `${propertyDocsData[0].addressLine1}, ${propertyDocsData[0].city}`, category: 'Maintenance', contractorId: contractorDocsData[0].id, contractorName: contractorDocsData[0].name, expenseType: 'one-off', ownerId: user.uid },
    { date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0], amount: 5000, propertyId: propertyDocsData[1].id, propertyName: `${propertyDocsData[1].addressLine1}, ${propertyDocsData[1].city}`, category: 'Repairs', contractorId: contractorDocsData[1].id, contractorName: contractorDocsData[1].name, expenseType: 'one-off', ownerId: user.uid },
    { date: new Date().toISOString().split('T')[0], amount: 25000, category: 'Insurance', propertyName: 'General Expense', expenseType: 'recurring', frequency: 'yearly', ownerId: user.uid },
  ];

  expensesToCreate.forEach(e => {
    const expDocRef = doc(expensesCollectionRef);
    batch.set(expDocRef, { ...e, type: 'expense' });
  });

  // 5. Maintenance Requests
  const maintenanceCollectionRef = collection(firestore, 'maintenanceRequests');
  const maintenanceToCreate = [
    { propertyId: propertyDocsData[0].id, propertyName: `${propertyDocsData[0].addressLine1}, ${propertyDocsData[0].city}`, description: 'Fix leaking kitchen sink', status: 'Done', priority: 'High', reportedDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], completedDate: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString().split('T')[0], contractorId: contractorDocsData[0].id, contractorName: contractorDocsData[0].name, cost: 15000, ownerId: user.uid },
    { propertyId: propertyDocsData[1].id, propertyName: `${propertyDocsData[1].addressLine1}, ${propertyDocsData[1].city}`, description: 'Repaint bedroom walls', status: 'In Progress', priority: 'Medium', reportedDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0], contractorId: contractorDocsData[0].id, contractorName: contractorDocsData[0].name, ownerId: user.uid },
    { propertyName: 'General Business Task', description: 'Annual fire safety inspection for all properties', status: 'To Do', priority: 'Medium', reportedDate: new Date().toISOString().split('T')[0], ownerId: user.uid },
  ];

  maintenanceToCreate.forEach(m => {
    const maintDocRef = doc(maintenanceCollectionRef);
    batch.set(maintDocRef, { ...m });
  });

  await batch.commit();
  console.log("Database seeded successfully.");
}

export function DataProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [hasSeedingBeenChecked, setHasSeedingBeenChecked] = useState(false);
  
  const propertiesQuery = useMemo(() => user?.uid ? query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);
  const revenueQuery = useMemo(() => user?.uid ? query(collection(firestore, 'revenue'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);
  const expensesQuery = useMemo(() => user?.uid ? query(collection(firestore, 'expenses'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);
  const maintenanceRequestsQuery = useMemo(() => user?.uid ? query(collection(firestore, 'maintenanceRequests'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);
  const contractorsQuery = useMemo(() => user?.uid ? query(collection(firestore, 'contractors'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);
  const changelogQuery = useMemo(() => user?.uid ? query(collection(firestore, 'changelog'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);

  const { data: properties, isLoading: loadingProperties } = useCollection<Property>(propertiesQuery);
  const { data: revenue, isLoading: loadingRevenue } = useCollection<Transaction>(revenueQuery);
  const { data: expenses, isLoading: loadingExpenses } = useCollection<Transaction>(expensesQuery);
  const { data: maintenanceRequests, isLoading: loadingMaintenance } = useCollection<MaintenanceRequest>(maintenanceRequestsQuery);
  const { data: contractors, isLoading: loadingContractors } = useCollection<Contractor>(contractorsQuery);
  const { data: rawChangelog, isLoading: loadingChangelog } = useCollection<ChangeLogEntry>(changelogQuery);

  const changelog = useMemo(() => {
    if (!rawChangelog) return null;
    return [...rawChangelog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rawChangelog]);
  
  // Overall data loading status
  const isDataLoading = isAuthLoading || loadingProperties || loadingRevenue || loadingExpenses || loadingChangelog || loadingMaintenance || loadingContractors;

  const [currency, setCurrency] = useState('KES');
  const [locale, setLocale] = useState('en-GB');
  const [companyName, setCompanyName] = useState('RentVision Ltd');
  const [residencyStatus, setResidencyStatus] = useState<ResidencyStatus>('non-resident');
  const [isPnlReportEnabled, setIsPnlReportEnabled] = useState(true);
  const [isMarketResearchEnabled, setIsMarketResearchEnabled] = useState(true);

  // --- DATA SEEDING EFFECT ---
  useEffect(() => {
    if (isAuthLoading || !user || !firestore || hasSeedingBeenChecked) {
      return;
    }

    const allCollectionsLoaded = !loadingProperties && !loadingRevenue && !loadingExpenses && !loadingMaintenance && !loadingContractors;

    if (allCollectionsLoaded) {
      setHasSeedingBeenChecked(true); 

      const shouldSeed =
        properties?.length === 0 &&
        revenue?.length === 0 &&
        expenses?.length === 0 &&
        maintenanceRequests?.length === 0 &&
        contractors?.length === 0;

      if (shouldSeed) {
        seedDatabase(firestore, user);
      }
    }
  }, [
    isAuthLoading, user, firestore, 
    properties, revenue, expenses, maintenanceRequests, contractors,
    loadingProperties, loadingRevenue, loadingExpenses, loadingMaintenance, loadingContractors,
    hasSeedingBeenChecked
  ]);


  // --- MUTATION FUNCTIONS ---

  const addChangeLogEntry = async (entry: Omit<ChangeLogEntry, 'id' | 'date' | 'ownerId'>) => {
    if (!user) return;
    const changelogCollection = collection(firestore, 'changelog');
    const newEntry = {
      ...entry,
      date: new Date().toISOString(),
      ownerId: user.uid,
    };
    await addDoc(changelogCollection, newEntry);
  };

  // Properties
  const addProperty = async (property: Omit<Property, 'id' | 'ownerId'>) => {
    if (!user) return;
    const propertiesCollection = collection(firestore, 'properties');
    const newProperty = { ...property, ownerId: user.uid };
    await addDoc(propertiesCollection, newProperty);
  };
  const updateProperty = async (property: Property) => {
    if (!user) return;
    const propDocRef = doc(firestore, 'properties', property.id);
    await setDoc(propDocRef, property, { merge: true });
  };
  const deleteProperty = async (propertyId: string) => {
    if (!user) return;
    const propDocRef = doc(firestore, 'properties', propertyId);
    await deleteDoc(propDocRef);
  };

  // Tenancy (Revenue)
  const addTenancy = async (transactions: Omit<Transaction, 'id' | 'ownerId'>[]) => {
    if (!user) return;
    const revenueCollection = collection(firestore, 'revenue');
    const batch = writeBatch(firestore);
    transactions.forEach(tx => {
      const txDocRef = doc(revenueCollection);
      batch.set(txDocRef, {...tx, ownerId: user.uid});
    });
    await batch.commit();
  };
  const updateTenancy = async (transactions: Transaction[]) => {
     if (!user) return;
    const revenueCollection = collection(firestore, 'revenue');
    const batch = writeBatch(firestore);

    const q = query(revenueCollection, where('tenancyId', '==', transactions[0].tenancyId), where('ownerId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const newIds = new Set(transactions.filter(t => t.id).map(t => t.id));

    querySnapshot.forEach(docSnap => {
        if (!newIds.has(docSnap.id)) {
            batch.delete(docSnap.ref);
        }
    });

    transactions.forEach(tx => {
      const docRef = tx.id ? doc(revenueCollection, tx.id) : doc(revenueCollection);
      batch.set(docRef, {...tx, ownerId: user.uid}, { merge: true });
    });
    await batch.commit();
  };
  const deleteTenancy = async (tenancyId: string) => {
    if (!user) return;
    const revenueCollection = collection(firestore, 'revenue');
    const q = query(revenueCollection, where('tenancyId', '==', tenancyId), where('ownerId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    querySnapshot.forEach((doc) => {
       batch.delete(doc.ref);
    });
    await batch.commit();
  };

  const endTenancy = async (tenancyId: string, newEndDate: Date) => {
    if (!user) return;
    const revenueCollection = collection(firestore, 'revenue');
    const newEndDateStr = format(newEndDate, 'yyyy-MM-dd');
    const batch = writeBatch(firestore);
    
    const q = query(revenueCollection, where('tenancyId', '==', tenancyId), where('ownerId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach(docSnap => {
        const tx = docSnap.data() as Transaction;
        const isFutureUnpaid = isAfter(new Date(tx.date), newEndDate) && (tx.amountPaid ?? 0) === 0;

        if (isFutureUnpaid) {
            batch.delete(docSnap.ref);
        } else {
            batch.update(docSnap.ref, { tenancyEndDate: newEndDateStr });
        }
    });
    
    await batch.commit();
  };

  const updateRevenueTransaction = async (transaction: Transaction) => {
    if (!user) return;
    const txDocRef = doc(firestore, 'revenue', transaction.id);
    await setDoc(txDocRef, transaction, { merge: true });
  };

  // Expenses
  const addExpense = async (expense: Omit<Transaction, 'id'|'type'|'ownerId'>) => {
    if (!user) return;
    const expensesCollection = collection(firestore, 'expenses');
    const newExpense = { ...expense, ownerId: user.uid, type: 'expense' as const };
    await addDoc(expensesCollection, newExpense);
  };
  const updateExpense = async (expense: Transaction) => {
    if (!user) return;
    const expDocRef = doc(firestore, 'expenses', expense.id);
    await setDoc(expDocRef, expense, { merge: true });
  };
  const deleteExpense = async (expenseId: string) => {
    if (!user) return;
    const expDocRef = doc(firestore, 'expenses', expenseId);
    await deleteDoc(expDocRef);
  };

  // Maintenance
  const addMaintenanceRequest = async (request: Omit<MaintenanceRequest, 'id'|'ownerId'>) => {
    if (!user) return;
    const maintenanceCollection = collection(firestore, 'maintenanceRequests');
    const newRequest = { ...request, ownerId: user.uid };
    await addDoc(maintenanceCollection, newRequest);
  };
  const updateMaintenanceRequest = async (request: MaintenanceRequest) => {
    if (!user) return;
    const reqDocRef = doc(firestore, 'maintenanceRequests', request.id);
    await setDoc(reqDocRef, request, { merge: true });
  };
  const deleteMaintenanceRequest = async (requestId: string) => {
    if (!user) return;
    const reqDocRef = doc(firestore, 'maintenanceRequests', requestId);
    await deleteDoc(reqDocRef);
  };
  
  // Contractors
  const addContractor = async (contractor: Omit<Contractor, 'id' | 'ownerId'>) => {
    if (!user) return;
    const contractorsCollection = collection(firestore, 'contractors');
    const newContractor = { ...contractor, ownerId: user.uid };
    await addDoc(contractorsCollection, newContractor);
  };
  const updateContractor = async (contractor: Contractor) => {
    if (!user) return;
    const conDocRef = doc(firestore, 'contractors', contractor.id);
    await setDoc(conDocRef, contractor, { merge: true });
  };
  const deleteContractor = async (contractorId: string) => {
    if (!user) return;
    const conDocRef = doc(firestore, 'contractors', contractorId);
    await deleteDoc(conDocRef);
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
            Vendor: item.contractorName,
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
    contractors,
    addContractor, updateContractor, deleteContractor,
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
    properties, revenue, expenses, maintenanceRequests, contractors, changelog, calendarEvents,
    currency, locale, companyName, residencyStatus, isPnlReportEnabled,
    isMarketResearchEnabled, isDataLoading, user?.uid
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
