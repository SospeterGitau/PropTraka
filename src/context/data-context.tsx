'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore } from '@/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { useUser } from '@/firebase/auth';
import type { Property, Transaction, UserSettings } from '@/lib/types';

interface DataContextType {
  properties: Property[];
  revenue: Transaction[];
  expenses: Transaction[];
  maintenanceRequests: any[];
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataContextProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [revenue, setRevenue] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    try {
      const unsubProperties = onSnapshot(
        collection(firestore, 'properties'),
        (snapshot) => {
          try {
            const data = snapshot.docs
              .filter(doc => doc.data().ownerId === user.uid)
              .map(doc => ({ id: doc.id, ...doc.data() })) as Property[];
            setProperties(data);
          } catch (err) {
            console.error('Error processing properties:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubProperties);

      const unsubRevenue = onSnapshot(
        collection(firestore, 'revenue'),
        (snapshot) => {
          try {
            const data = snapshot.docs
              .filter(doc => doc.data().ownerId === user.uid)
              .map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
            setRevenue(data);
          } catch (err) {
            console.error('Error processing revenue:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubRevenue);

      const unsubExpenses = onSnapshot(
        collection(firestore, 'expenses'),
        (snapshot) => {
          try {
            const data = snapshot.docs
              .filter(doc => doc.data().ownerId === user.uid)
              .map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
            setExpenses(data);
          } catch (err) {
            console.error('Error processing expenses:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubExpenses);

      const unsubMaintenance = onSnapshot(
        collection(firestore, 'maintenanceRequests'),
        (snapshot) => {
          try {
            const data = snapshot.docs
              .filter(doc => doc.data().ownerId === user.uid)
              .map(doc => ({ id: doc.id, ...doc.data() }));
            setMaintenanceRequests(data);
          } catch (err) {
            console.error('Error processing maintenance:', err);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubMaintenance);

      const unsubSettings = onSnapshot(
        doc(firestore, 'userSettings', user.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            setSettings(snapshot.data() as UserSettings);
          }
        },
        (err) => setError(err.message)
      );
      unsubscribers.push(unsubSettings);

      setTimeout(() => setLoading(false), 500);
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