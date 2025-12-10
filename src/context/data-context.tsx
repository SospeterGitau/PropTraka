
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore } from '@/firebase';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
import { useUser } from '@/firebase';
import type { Property, Transaction, Tenant, Tenancy, Contractor, MaintenanceRequest, UserSettings, Expense, SubscriptionPlan } from '@/lib/types';
import subscriptionPlans from '@/lib/subscription-plans.json';


interface DataContextType {
  properties: Property[];
  revenue: Transaction[];
  expenses: Expense[];
  tenants: Tenant[];
  tenancies: Tenancy[];
  contractors: Contractor[];
  maintenanceRequests: MaintenanceRequest[];
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultSettings: UserSettings = {
    currency: 'KES',
    locale: 'en-KE',
    companyName: 'My Company',
    residencyStatus: 'resident',
    isPnlReportEnabled: true,
    isMarketResearchEnabled: true,
    theme: 'system',
    role: 'Individual Landlord',
    portfolioSize: '1-5',
    subscription: subscriptionPlans.find(p => p.name === 'Starter') || null,
};

export function DataContextProvider({ children }: { children: ReactNode }) {
  const { user, isAuthLoading } = useUser();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [revenue, setRevenue] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait until auth state is determined
    if (isAuthLoading) {
        return;
    }
    
    // If no user, reset to default state and stop loading
    if (!user) {
      setProperties([]);
      setRevenue([]);
      setExpenses([]);
      setTenants([]);
      setTenancies([]);
      setContractors([]);
      setMaintenanceRequests([]);
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }
    
    // If there is a user, start loading data
    setIsLoading(true);

    const collectionsToSubscribe = [
      { name: 'properties', setter: setProperties },
      { name: 'revenue', setter: setRevenue },
      { name: 'expenses', setter: setExpenses as React.Dispatch<React.SetStateAction<any[]>> },
      { name: 'tenants', setter: setTenants },
      { name: 'tenancies', setter: setTenancies },
      { name: 'contractors', setter: setContractors },
      { name: 'maintenanceRequests', setter: setMaintenanceRequests },
    ];
    
    const unsubscribers = collectionsToSubscribe.map(({ name, setter }) => {
      const q = query(collection(firestore, name), where('ownerId', '==', user.uid));
      return onSnapshot(q, 
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          setter(data);
        }, 
        (err) => {
          console.error(`Error loading ${name}:`, err);
          setError(`Failed to load ${name}.`);
        }
      );
    });

    // Subscribe to user-specific settings
    const settingsRef = doc(firestore, 'userSettings', user.uid);
    const unsubSettings = onSnapshot(settingsRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(prev => ({ ...prev, ...snapshot.data() as UserSettings }));
        } else {
          setSettings(defaultSettings);
        }
      },
      (err) => {
        console.error('Error loading settings:', err);
        setSettings(defaultSettings); // Fallback to defaults
      }
    );
    unsubscribers.push(unsubSettings);

    const subRef = doc(firestore, 'subscriptions', user.uid);
    const unsubSubscription = onSnapshot(subRef,
        (snapshot) => {
            let userPlan: SubscriptionPlan | null = null;
            if(snapshot.exists()) {
                const subData = snapshot.data();
                userPlan = subscriptionPlans.find(p => p.name === subData.plan) || null;
            } else {
                userPlan = subscriptionPlans.find(p => p.name === 'Starter') || null;
            }
            setSettings(prev => ({ ...prev, subscription: userPlan }));
        },
        (err) => {
            console.error('Error loading subscription:', err);
            const starterPlan = subscriptionPlans.find(p => p.name === 'Starter') || null;
            setSettings(prev => ({ ...prev, subscription: starterPlan }));
        }
    );
    unsubscribers.push(unsubSubscription);
    
    // De-bounce loading state
    const timer = setTimeout(() => setIsLoading(false), 500);
    unsubscribers.push(() => clearTimeout(timer));

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [user, isAuthLoading]);
  
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
      if(!user) return;
      const settingsRef = doc(firestore, 'userSettings', user.uid);
      await setDoc(settingsRef, newSettings, { merge: true });
      // The onSnapshot listener will update the state automatically
  };

  const value = { 
      properties, 
      revenue, 
      expenses, 
      tenants, 
      tenancies, 
      contractors, 
      maintenanceRequests, 
      settings, 
      isLoading, 
      error,
      updateSettings
  };

  return (
    <DataContext.Provider value={value}>
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
