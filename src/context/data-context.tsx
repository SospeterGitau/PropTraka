
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore } from '@/firebase';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore'; // Added query and where
import { useUser } from '@/firebase/auth';
import type {
  Property,
  RevenueTransaction,
  Expense,
  Contractor,
  MaintenanceRequest,
  Tenant,
  Tenancy,
  AppDocument,
  AppUser,
  UserSettings,
} from '@/lib/db-types'; // Updated import path and types

interface DataContextType {
  properties: Property[];
  revenue: RevenueTransaction[]; // Updated type
  expenses: Expense[];
  maintenanceRequests: MaintenanceRequest[];
  contractors: Contractor[];
  tenants: Tenant[]; // New collection
  tenancies: Tenancy[]; // New collection
  appDocuments: AppDocument[]; // New collection
  // appUsers: AppUser[]; // AppUser data can be derived from auth or fetched separately if needed
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataContextProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [revenue, setRevenue] = useState<RevenueTransaction[]>([]); // Updated type
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]); // New state
  const [tenancies, setTenancies] = useState<Tenancy[]>([]); // New state
  const [appDocuments, setAppDocuments] = useState<AppDocument[]>([]); // New state
  // const [appUsers, setAppUsers] = useState<AppUser[]>([]); // New state for app-specific users
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      // Clear all data when user logs out
      setProperties([]);
      setRevenue([]);
      setExpenses([]);
      setMaintenanceRequests([]);
      setContractors([]);
      setTenants([]);
      setTenancies([]);
      setAppDocuments([]);
      setSettings(null);
      return;
    }

    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    try {
      // Properties
      const qProperties = query(collection(firestore, 'properties'), where('ownerId', '==', user.uid));
      const unsubProperties = onSnapshot(
        qProperties,
        (snapshot) => {
          try {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[];
            setProperties(data);
          } catch (err) {
            console.error('Error processing properties:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubProperties);

      // Revenue
      const qRevenue = query(collection(firestore, 'revenue'), where('ownerId', '==', user.uid));
      const unsubRevenue = onSnapshot(
        qRevenue,
        (snapshot) => {
          try {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RevenueTransaction[]; // Updated type
            setRevenue(data);
          } catch (err) {
            console.error('Error processing revenue:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubRevenue);

      // Expenses
      const qExpenses = query(collection(firestore, 'expenses'), where('ownerId', '==', user.uid));
      const unsubExpenses = onSnapshot(
        qExpenses,
        (snapshot) => {
          try {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
            setExpenses(data);
          } catch (err) {
            console.error('Error processing expenses:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubExpenses);

      // Maintenance Requests
      const qMaintenance = query(collection(firestore, 'maintenanceRequests'), where('ownerId', '==', user.uid));
      const unsubMaintenance = onSnapshot(
        qMaintenance,
        (snapshot) => {
          try {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MaintenanceRequest[];
            setMaintenanceRequests(data);
          } catch (err) {
            console.error('Error processing maintenance:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubMaintenance);

      // Contractors
      const qContractors = query(collection(firestore, 'contractors'), where('ownerId', '==', user.uid));
      const unsubContractors = onSnapshot(
        qContractors,
        (snapshot) => {
          try {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Contractor[];
            setContractors(data);
          } catch (err) {
            console.error('Error processing contractors:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubContractors);

      // Tenants (NEW)
      const qTenants = query(collection(firestore, 'tenants'), where('ownerId', '==', user.uid));
      const unsubTenants = onSnapshot(
        qTenants,
        (snapshot) => {
          try {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[];
            setTenants(data);
          } catch (err) {
            console.error('Error processing tenants:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubTenants);

      // Tenancies (NEW)
      const qTenancies = query(collection(firestore, 'tenancies'), where('ownerId', '==', user.uid));
      const unsubTenancies = onSnapshot(
        qTenancies,
        (snapshot) => {
          try {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenancy[];
            setTenancies(data);
          } catch (err) {
            console.error('Error processing tenancies:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubTenancies);

      // AppDocuments (NEW)
      const qAppDocuments = query(collection(firestore, 'appDocuments'), where('ownerId', '==', user.uid));
      const unsubAppDocuments = onSnapshot(
        qAppDocuments,
        (snapshot) => {
          try {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppDocument[];
            setAppDocuments(data);
          } catch (err) {
            console.error('Error processing appDocuments:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubAppDocuments);

      // UserSettings (collection name changed to 'userSettings')
      const unsubSettings = onSnapshot(
        doc(firestore, 'userSettings', user.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            setSettings(snapshot.data() as UserSettings);
          } else {
            // Handle case where settings document might not exist yet
            setSettings(null);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubSettings);

      // AppUser - We can get basic AppUser data from Firebase Auth 'user' object directly,
      // or fetch additional custom claims/profile data from an 'appUsers' collection if needed.
      // For now, we'll rely on the existing 'user' object from useUser() for basic user info.

      setLoading(false); // Set loading to false after all initial subscriptions are set up

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [authLoading, user]);

  return (
    <DataContext.Provider
      value={{
        properties,
        revenue,
        expenses,
        maintenanceRequests,
        contractors,
        tenants,
        tenancies,
        appDocuments,
        settings,
        loading,
        error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataContextProvider');
  }
  return context;
}
