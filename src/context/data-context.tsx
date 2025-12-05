
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, useFirebase } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserSettings, Property, Subscription, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createUserQuery } from '@/firebase/firestore/query-builder';

interface DataContextValue {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
  properties: Property[];
  revenue: Transaction[];
  expenses: Transaction[];
  subscription: Subscription | null;
  refreshData: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  currency: 'KES',
  locale: 'en-GB',
  companyName: 'My Property Portfolio',
  residencyStatus: 'resident' as const,
  isPnlReportEnabled: true,
  isMarketResearchEnabled: true,
  subscription: null,
  theme: 'system',
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  // --- Real-time data fetching with useCollection ---
  const propertiesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'properties', user.uid) : null, [user, firestore]);
  const revenueQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'revenue', user.uid) : null, [user, firestore]);
  const expensesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'expenses', user.uid) : null, [user, firestore]);

  const [propertiesSnapshot, isPropertiesLoading] = useCollection(propertiesQuery);
  const [revenueSnapshot, isRevenueLoading] = useCollection(revenueQuery);
  const [expensesSnapshot, isExpensesLoading] = useCollection(expensesQuery);
  
  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)) || [], [propertiesSnapshot]);
  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)) || [], [revenueSnapshot]);
  const expenses = useMemo(() => expensesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)) || [], [expensesSnapshot]);
  
  // --- Auth State ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Initial & On-Demand Data Loading ---
  const loadInitialSettings = useCallback(async () => {
    if (!user) {
        setIsSettingsLoading(false);
        return;
    };
    
    setIsSettingsLoading(true);
    try {
      // Load settings
      const settingsRef = doc(firestore, 'userSettings', user.uid);
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        setSettings({ ...defaultSettings, ...settingsSnap.data() });
      } else {
        setSettings(defaultSettings);
      }
      
      // Load subscription
      const subscriptionRef = doc(firestore, 'subscriptions', user.uid);
      const subscriptionSnap = await getDoc(subscriptionRef);
      if (subscriptionSnap.exists()) {
        setSubscription(subscriptionSnap.data() as Subscription);
      } else {
        setSubscription(null);
      }

    } catch (error) {
      console.error('Error loading static data:', error);
    } finally {
      setIsSettingsLoading(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    if (!isAuthLoading && user) {
      loadInitialSettings();
    }
  }, [isAuthLoading, user, loadInitialSettings]);
  
  const refreshData = async () => {
      await loadInitialSettings();
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to save settings.',
      });
      return;
    }

    const settingsRef = doc(firestore, 'userSettings', user.uid);
    try {
      const { subscription, ...settingsToSave } = newSettings;
      const updatedSettings = { ...settings, ...settingsToSave };

      await setDoc(settingsRef, { ...settingsToSave, ownerId: user.uid }, { merge: true });
      setSettings(updatedSettings);

      toast({
        title: 'Settings Saved',
        description: 'Your settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
      });
    }
  };

  const isLoading = isAuthLoading || isPropertiesLoading || isRevenueLoading || isExpensesLoading || isSettingsLoading;

  const value = {
    settings,
    updateSettings,
    isLoading,
    properties,
    revenue,
    expenses,
    subscription,
    refreshData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}
