'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore } from '@/firebase';
import { collection, onSnapshot, doc, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useUser } from '@/firebase/auth';
import type {
  Contractor,
  MaintenanceRequest,
  AppDocument,
  UserSettings,
} from '@/lib/types';

interface DataContextType {
  maintenanceRequests: MaintenanceRequest[];
  contractors: Contractor[];
  appDocuments: AppDocument[];
  settings: UserSettings | null;
  loading: boolean;
  isLoading: boolean; // alias for some callers
  error: string | null;
  // CRUD helpers (Legacy - Only for non-migrated entities)
  addContractor: (data: Omit<Contractor, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContractor: (id: string, data: Partial<Contractor>) => Promise<void>;
  addMaintenanceRequest: (data: Omit<MaintenanceRequest, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMaintenanceRequest: (id: string, data: Partial<MaintenanceRequest>) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataContextProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser();

  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
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
      setMaintenanceRequests([]);
      setContractors([]);
      setAppDocuments([]);
      setSettings(null);
      return;
    }

    console.log(`[DataContext] User authenticated with UID: ${user.uid}. Setting up Firestore listeners.`);
    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    const collectionsToSubscribe: { name: string; setter: (data: any) => void; type: any }[] = [
      { name: 'maintenanceRequests', setter: setMaintenanceRequests, type: {} as MaintenanceRequest },
      { name: 'contractors', setter: setContractors, type: {} as Contractor },
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

  // CRUD Implementations
  const addContractor = async (data: Omit<Contractor, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    await addDoc(collection(firestore, 'contractors'), {
      ...data,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateContractor = async (id: string, data: Partial<Contractor>) => {
    if (!user) throw new Error('Not authenticated');
    const ref = doc(firestore, 'contractors', id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  };

  const addMaintenanceRequest = async (data: Omit<MaintenanceRequest, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    await addDoc(collection(firestore, 'maintenanceRequests'), {
      ...data,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateMaintenanceRequest = async (id: string, data: Partial<MaintenanceRequest>) => {
    if (!user) throw new Error('Not authenticated');
    const ref = doc(firestore, 'maintenanceRequests', id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  };

  const updateSettings = async (data: Partial<UserSettings>) => {
    if (!user) throw new Error('Not authenticated');
    const ref = doc(firestore, 'userSettings', user.uid);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  };

  return (
    <DataContext.Provider
      value={{
        maintenanceRequests,
        contractors,
        appDocuments,
        settings,
        loading,
        isLoading: loading,
        error,
        addContractor,
        updateContractor,
        addMaintenanceRequest,
        updateMaintenanceRequest,
        updateSettings,
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
