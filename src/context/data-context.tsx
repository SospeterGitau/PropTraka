'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useUser } from '@/firebase';
import type { Property, Transaction } from '@/lib/types';

interface DataContextType {
  properties: Property[];
  revenue: Transaction[];
  expenses: Transaction[];
  settings: any;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataContextProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [properties, setProperties] = useState<Property[]>([]);
  const [revenue, setRevenue] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setProperties([]);
      setRevenue([]);
      setExpenses([]);
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    try {
      const propertiesQuery = query(collection(db, 'properties'), where('userId', '==', user.uid));
      const unsubscribeProperties = onSnapshot(propertiesQuery, (snapshot) => {
        const propsData: Property[] = [];
        snapshot.forEach((doc) => {
          propsData.push({ id: doc.id, ...doc.data() } as Property);
        });
        setProperties(propsData);
        console.log('✅ Properties loaded:', propsData.length);
      }, (err) => {
        console.error('❌ Properties error:', err);
        setError('Failed to load properties');
      });
      unsubscribers.push(unsubscribeProperties);

      const revenueQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('type', '==', 'income'));
      const unsubscribeRevenue = onSnapshot(revenueQuery, (snapshot) => {
        const revData: Transaction[] = [];
        snapshot.forEach((doc) => {
          revData.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setRevenue(revData);
        console.log('✅ Revenue loaded:', revData.length);
      });
      unsubscribers.push(unsubscribeRevenue);

      const expensesQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('type', '==', 'expense'));
      const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
        const expData: Transaction[] = [];
        snapshot.forEach((doc) => {
          expData.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setExpenses(expData);
        console.log('✅ Expenses loaded:', expData.length);
      });
      unsubscribers.push(unsubscribeExpenses);

      setLoading(false);
    } catch (err) {
      console.error('❌ Context error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user?.uid]);

  return (
    <DataContext.Provider value={{ properties, revenue, expenses, settings, loading, error }}>
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
