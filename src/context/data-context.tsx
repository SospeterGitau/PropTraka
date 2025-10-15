
'use client';

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Property, Transaction, CalendarEvent, ResidencyStatus, ChangeLogEntry } from '@/lib/types';
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

export function DataProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user } = useUser();

  // Firestore collections
  const propertiesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'properties') : null, [firestore, user]);
  const revenueRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'revenue') : null, [firestore, user]);
  const expensesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'expenses') : null, [firestore, user]);
  const changelogRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'changelog') : null, [firestore, user]);

  const { data: properties, isLoading: loadingProperties } = useCollection<Property>(propertiesRef);
  const { data: revenue, isLoading: loadingRevenue } = useCollection<Transaction>(revenueRef);
  const { data: expenses, isLoading: loadingExpenses } = useCollection<Transaction>(expensesRef);
  const { data: changelog, isLoading: loadingChangelog } = useCollection<ChangeLogEntry>(changelogRef, {
    sortField: 'date',
    sortDirection: 'desc',
  });

  const isDataLoading = loadingProperties || loadingRevenue || loadingExpenses || loadingChangelog;

  const [currency, setCurrency] = useState('KES');
  const [locale, setLocale] = useState('en-GB');
  const [companyName, setCompanyName] = useState('RentVision Ltd');
  const [residencyStatus, setResidencyStatus] = useState<ResidencyStatus>('non-resident');
  const [isPnlReportEnabled, setIsPnlReportEnabled] = useState(true);
  const [isMarketResearchEnabled, setIsMarketResearchEnabled] = useState(true);

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
    properties, revenue, expenses, changelog, calendarEvents,
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
