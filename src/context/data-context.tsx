
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore as db } from '@/firebase';
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

export function DataContextProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const [properties, setProperties] = useState<Property[]>([]);
  const [revenue, setRevenue] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // CRITICAL: Wait for auth to finish before setting up listeners
    if (authLoading) {
      console.log('⏳ Firebase Auth initializing...');
      return;
    }

    // If no user, just set loading to false
    if (!user?.uid) {
      console.log('⚠️ No authenticated user - skipping data load');
      setProperties([]);
      setRevenue([]);
      setExpenses([]);
      setLoading(false);
      return;
    }

    console.log('🔄 Auth ready - setting up Firestore listeners for user:', user.uid);
    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    try {
      // Listen to properties collection
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('user_id', '==', user.uid)
      );

      const unsubProperties = onSnapshot(
        propertiesQuery,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Property[];
          setProperties(data);
          console.log(`✅ Properties loaded: ${data.length}`);
        },
        (err) => {
          console.error('❌ Error loading properties:', err);
          setError(err.message);
        }
      );
      unsubscribers.push(unsubProperties);

      // Listen to revenue collection
      const revenueQuery = query(
        collection(db, 'revenue'),
        where('user_id', '==', user.uid)
      );

      const unsubRevenue = onSnapshot(
        revenueQuery,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Transaction[];
          setRevenue(data);
          console.log(`✅ Revenue entries loaded: ${data.length}`);
        },
        (err) => {
          console.error('❌ Error loading revenue:', err);
          setError(err.message);
        }
      );
      unsubscribers.push(unsubRevenue);

      // Listen to expenses collection
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('user_id', '==', user.uid)
      );

      const unsubExpenses = onSnapshot(
        expensesQuery,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Transaction[];
          setExpenses(data);
          console.log(`✅ Expenses loaded: ${data.length}`);
        },
        (err) => {
          console.error('❌ Error loading expenses:', err);
          setError(err.message);
        }
      );
      unsubscribers.push(unsubExpenses);

      // Mark loading as complete after first batch
      setTimeout(() => setLoading(false), 500);
    } catch (err: any) {
      console.error('❌ Setup error:', err.message);
      setError(err.message);
      setLoading(false);
    }

    // Cleanup: unsubscribe from all listeners
    return () => {
      console.log('🧹 Cleaning up Firestore listeners');
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [user?.uid, authLoading]); // Re-run if user changes

  return (
    <DataContext.Provider
      value={{
        properties,
        revenue,
        expenses,
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
