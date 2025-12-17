
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore } from '@/firebase';
import { collection, onSnapshot, doc, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
} from '@/lib/types';

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
  isLoading: boolean; // alias for some callers
  error: string | null;
  // CRUD helpers
  addProperty: (data: Omit<Property, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<void>;
  addContractor: (data: Omit<Contractor, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContractor: (id: string, data: Partial<Contractor>) => Promise<void>;
  addMaintenanceRequest: (data: Omit<MaintenanceRequest, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMaintenanceRequest: (id: string, data: Partial<MaintenanceRequest>) => Promise<void>;
  addTenant: (data: Omit<Tenant, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTenant: (id: string, data: Partial<Tenant>) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
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
            const startTime = Date.now();
            console.log(`[DataContext] Setting up listener for: ${name}`);
            const q = query(collection(firestore, name), where('ownerId', '==', user.uid));
            const unsubscribe = onSnapshot(
              q,
              (snapshot) => {
                const elapsed = Date.now() - startTime;
                console.log(`[DataContext] ${name}: received ${snapshot.size} docs (${elapsed}ms)`);
                const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setter(docs as any);
              },
              (err) => {
                console.error(`[DataContext] Error in ${name} listener:`, err);
                setError(`Failed to fetch ${name}: ${err.message}`);
              }
            );
            unsubscribers.push(unsubscribe);
        });
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
        isLoading: loading,
        error,
        // helpers
        addProperty: async (data) => {
          if (!user) throw new Error('Not authenticated');
          await addDoc(collection(firestore, 'properties'), {
            ...data,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        },
        updateProperty: async (id, data) => {
          if (!user) throw new Error('Not authenticated');
          const ref = doc(firestore, 'properties', id);
          await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        },
        addContractor: async (data) => {
          if (!user) throw new Error('Not authenticated');
          await addDoc(collection(firestore, 'contractors'), {
            ...data,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        },
        updateContractor: async (id, data) => {
          if (!user) throw new Error('Not authenticated');
          const ref = doc(firestore, 'contractors', id);
          await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        },
        addMaintenanceRequest: async (data) => {
          if (!user) throw new Error('Not authenticated');
          await addDoc(collection(firestore, 'maintenanceRequests'), {
            ...data,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        },
        updateMaintenanceRequest: async (id, data) => {
          if (!user) throw new Error('Not authenticated');
          const ref = doc(firestore, 'maintenanceRequests', id);
          await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        },
        addTenant: async (data) => {
          if (!user) throw new Error('Not authenticated');
          await addDoc(collection(firestore, 'tenants'), {
            ...data,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        },
        updateTenant: async (id, data) => {
          if (!user) throw new Error('Not authenticated');
          const ref = doc(firestore, 'tenants', id);
          await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        },
        updateSettings: async (data) => {
          if (!user) throw new Error('Not authenticated');
          const ref = doc(firestore, 'userSettings', user.uid);
          await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        },
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
