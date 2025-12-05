
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { doc, getDoc, setDoc, Query } from 'firebase/firestore';
import type { UserSettings, Property, Subscription, Transaction, SecurityRuleContext } from '@/lib/types';
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

  const [propertiesSnapshot, isPropertiesLoading, propertiesError] = useCollection(propertiesQuery);
  const [revenueSnapshot, isRevenueLoading, revenueError] = useCollection(revenueQuery);
  const [expensesSnapshot, isExpensesLoading, expensesError] = useCollection(expensesQuery);
  
  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)) || [], [propertiesSnapshot]);
  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)) || [], [revenueSnapshot]);
  const expenses = useMemo(() => expensesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)) || [], [expensesSnapshot]);

  // --- Watch for permission errors from hooks ---
  useEffect(() => {
    const handlePermissionError = (error: any, query: Query | null) => {
        if (error && error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: query ? (query as any)._query.path.segments.join('/') : 'unknown collection',
                operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        }
    };
    
    handlePermissionError(propertiesError, propertiesQuery);
    handlePermissionError(revenueError, revenueQuery);
    handlePermissionError(expensesError, expensesQuery);

  }, [propertiesError, revenueError, expensesError, propertiesQuery, revenueQuery, expensesQuery]);
  
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

    } catch (error: any) {
      console.error('Error loading static data:', error);
      // Emit contextual error if it's a permission issue
      if (error.code === 'permission-denied' && user) {
          const permissionError = new FirestorePermissionError({
            path: `userSettings/${user.uid}`,
            operation: 'get',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
      }
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

      await setDoc(settingsRef, { ...settingsToSave, ownerId: user.uid }, { merge: true })
      .catch(error => {
          const permissionError = new FirestorePermissionError({
            path: settingsRef.path,
            operation: 'update',
            requestResourceData: { ...settingsToSave, ownerId: user.uid }
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
          // throw the original error to be caught by the outer catch block
          throw error;
      });
      
      setSettings(updatedSettings);

      toast({
        title: 'Settings Saved',
        description: 'Your settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      // The toast will only be shown if the error was not a permission error handled above.
      if ((error as any)?.name !== 'FirebaseError') {
         toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save settings. Please try again.',
        });
      }
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
