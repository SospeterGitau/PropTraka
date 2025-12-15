
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore } from '@/firebase';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
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
  UserSettings,
} from '@/lib/db-types';

interface DataContextType {
  properties: Property[];
  revenue: RevenueTransaction[];
  expenses: Expense[];
  maintenanceRequests: MaintenanceRequest[];
  contractors: Contractor[];
  tenants: Tenant[];
  tenancies: Tenancy[];
  appDocuments: AppDocument[];
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataContextProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [revenue, setRevenue] = useState<RevenueTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [appDocuments, setAppDocuments] = useState<AppDocument[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[DataContext] Auth loading state:', authLoading);
    if (authLoading) return;

    if (!user) {
      console.log('[DataContext] No user found. Clearing data and stopping listeners.');
      setLoading(false);
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

    console.log(`[DataContext] User authenticated with UID: ${user.uid}. Setting up Firestore listeners.`);
    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    const collectionsToSubscribe: { name: string; setter: (data: any) => void; type: any }[] = [
        { name: 'properties', setter: setProperties, type: {} as Property },
        { name: 'revenue', setter: setRevenue, type: {} as RevenueTransaction },
        { name: 'expenses', setter: setExpenses, type: {} as Expense },
        { name: 'maintenanceRequests', setter: setMaintenanceRequests, type: {} as MaintenanceRequest },
        { name: 'contractors', setter: setContractors, type: {} as Contractor },
        { name: 'tenants', setter: setTenants, type: {} as Tenant },
        { name: 'tenancies', setter: setTenancies, type: {} as Tenancy },
        { name: 'appDocuments', setter: setAppDocuments, type: {} as AppDocument },
    ];

    try {
        collectionsToSubscribe.forEach(({ name, setter }) => {
            const q = query(collection(firestore, name), where('ownerId', '==', user.uid));
            const unsubscribe = onSnapshot(
              q,
              (snapshot) => {
                try {
                  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  console.log(`[DataContext] Fetched ${snapshot.size} documents from '${name}'.`);
                  setter(data);
                } catch (err) {
                  console.error(`[DataContext] Error processing snapshot for '${name}':`, err);
                }
              },
              (err) => {
                console.error(`[DataContext] Firestore snapshot error for '${name}':`, err);
                setError(err.message);
              }
            );
            unsubscribers.push(unsubscribe);
        });

      // UserSettings
      const unsubSettings = onSnapshot(
        doc(firestore, 'userSettings', user.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            console.log('[DataContext] Fetched user settings.');
            setSettings(snapshot.data() as UserSettings);
          } else {
            console.log('[DataContext] User settings document does not exist.');
            setSettings(null);
          }
        },
        (err) => {
            console.error(`[DataContext] Firestore snapshot error for 'userSettings':`, err);
            setError(err.message);
        }
      );
      unsubscribers.push(unsubSettings);

      console.log('[DataContext] All listeners attached.');
      setLoading(false);

    } catch (err: any) {
      console.error('[DataContext] Error setting up listeners:', err);
      setError(err.message);
      setLoading(false);
    }

    return () => {
      console.log('[DataContext] Cleaning up listeners.');
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
