'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore } from '@/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { useUser } from '@/firebase';
import type { Property, Transaction, UserSettings } from '@/lib/types';

interface DataContextType {
  properties: Property[];
  revenue: Transaction[];
  expenses: Transaction[];
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
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // CRITICAL: Wait for auth to finish before setting up listeners
    if (authLoading) {
      console.log('⏳ Firebase Auth initializing...');
      return;
    }

    if (!user) {
      console.log('⏳ No authenticated user, skipping data load');
      setLoading(false);
      return;
    }

    console.log('🔄 Auth ready - setting up Firestore listeners (no user_id filter)');
    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    try {
      // Listen to ALL properties (no user_id filter)
      const unsubProperties = onSnapshot(
        collection(firestore, 'properties'),
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

      // Listen to ALL revenue (no user_id filter)
      const unsubRevenue = onSnapshot(
        collection(firestore, 'revenue'),
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

      // Listen to ALL expenses (no user_id filter)
      const unsubExpenses = onSnapshot(
        collection(firestore, 'expenses'),
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

      // Load user settings from userSettings collection
      const unsubSettings = onSnapshot(
        doc(firestore, 'userSettings', user.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            const settingsData = snapshot.data() as UserSettings;
            setSettings(settingsData);
            console.log(`✅ User settings loaded:`, settingsData);
            console.log(`   Currency: ${settingsData.currency}`);
            console.log(`   Locale: ${settingsData.locale}`);
            console.log(`   Theme: ${settingsData.theme || 'system'}`);
            console.log(`   Role: ${settingsData.role || 'Not set'}`);
          } else {
            console.log('⚠️  No user settings found, using defaults');
            // Set default settings if document doesn't exist
            setSettings({
              currency: 'KES',
              locale: 'en-KE',
              companyName: 'My Company',
              residencyStatus: 'Resident',
              isPnlReportEnabled: true,
              isMarketResearchEnabled: true,
              theme: 'system',
              role: 'Individual Landlord',
            } as UserSettings);
          }
        },
        (err) => {
          console.error('❌ Error loading settings:', err);
          // Set default settings on error
          setSettings({
            currency: 'KES',
            locale: 'en-KE',
            companyName: 'My Company',
            residencyStatus: 'Resident',
            isPnlReportEnabled: true,
            isMarketResearchEnabled: true,
            theme: 'system',
            role: 'Individual Landlord',
          } as UserSettings);
        }
      );
      unsubscribers.push(unsubSettings);

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
  }, [authLoading, user]); // Depends on both authLoading and user

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
