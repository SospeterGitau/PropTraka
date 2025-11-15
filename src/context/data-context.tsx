

'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import type { ResidencyStatus, Subscription, Property } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { seedSampleData } from '@/lib/data-seeder';

export interface UserSettings {
  currency: string;
  locale: string;
  companyName: string;
  residencyStatus: ResidencyStatus;
  isPnlReportEnabled: boolean;
  isMarketResearchEnabled: boolean;
  subscription?: Subscription | null; // Add subscription to settings
}

interface DataContextValue {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
  hasSampleData: boolean;
  clearSampleData: () => Promise<void>;
}

const defaultSettings: Omit<UserSettings, 'subscription'> = {
  currency: 'KES',
  locale: 'en-GB',
  companyName: 'My Property Portfolio',
  residencyStatus: 'resident',
  isPnlReportEnabled: true,
  isMarketResearchEnabled: true,
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isAuthLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [settings, setSettings] = useState<UserSettings>({ ...defaultSettings, subscription: null });
  const [isLoading, setIsLoading] = useState(true);
  const [hasSampleData, setHasSampleData] = useState(false);

  const fetchAppData = useCallback(async () => {
    if (!user || !firestore) return;

    setIsLoading(true);
    
    try {
        const settingsRef = doc(firestore, 'userSettings', user.uid);
        const settingsSnap = await getDoc(settingsRef);
        let userSettings: UserSettings;
        
        if (settingsSnap.exists()) {
            userSettings = { ...defaultSettings, ...settingsSnap.data() } as UserSettings;
        } else {
            userSettings = defaultSettings as UserSettings;
            await setDoc(settingsRef, { ...defaultSettings, ownerId: user.uid });
        }

        const subsQuery = query(collection(firestore, 'subscriptions'), where('ownerId', '==', user.uid));
        const subsSnap = await getDocs(subsQuery);
        
        if (subsSnap.empty) {
            const subRef = doc(collection(firestore, 'subscriptions'));
            const newSub: Subscription = {
                id: subRef.id,
                ownerId: user.uid,
                plan: 'Starter',
                status: 'active',
                billingCycle: 'monthly',
                currentPeriodStart: new Date().toISOString(),
                currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
            };
            await setDoc(subRef, newSub);
            userSettings.subscription = newSub;
        } else {
            userSettings.subscription = subsSnap.docs[0].data() as Subscription;
        }

        // Check for properties and seed if none exist
        const propertiesQuery = query(collection(firestore, 'properties'), where('ownerId', '==', user.uid));
        const propertiesSnap = await getDocs(propertiesQuery);
        if (propertiesSnap.empty) {
            await seedSampleData(user.uid);
            setHasSampleData(true);
            toast({
                title: "Welcome!",
                description: "We've added some sample data to help you get started. You can remove it from the Account page.",
            });
        } else {
            const firstProp = propertiesSnap.docs[0].data() as Property;
            // A simple heuristic to check if it's sample data
            setHasSampleData(firstProp.addressLine1 === '45 Uhuru Gardens Lane');
        }

        setSettings(userSettings);

    } catch (error) {
        console.error("Error fetching data:", error);
        setSettings({ ...defaultSettings, subscription: null });
    } finally {
        setIsLoading(false);
    }
  }, [user, firestore, toast]);

  useEffect(() => {
    if (!isAuthLoading && user) {
        fetchAppData();
    } else if (!isAuthLoading && !user) {
        setIsLoading(false);
    }
  }, [isAuthLoading, user, fetchAppData]);
  
  const clearSampleData = async () => {
    if (!user) return;
    try {
        const { clearSampleData: clearDataOnServer } = await import('@/lib/data-seeder');
        await clearDataOnServer(user.uid);
        setHasSampleData(false);
        toast({
            title: "Sample Data Cleared",
            description: "All sample properties, tenancies, and other records have been removed.",
        });
        // Force a reload to clear all local state and refetch from empty DB
        window.location.reload();
    } catch (error) {
        console.error("Failed to clear sample data:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not clear sample data. Please try again.",
        });
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Authenticated",
            description: "You must be logged in to save settings.",
        });
        return;
    }
    const settingsRef = doc(firestore, 'userSettings', user.uid);
    try {
      const { subscription, ...settingsToSave } = newSettings;
      const updatedSettings = { ...settings, ...settingsToSave };
      
      await setDoc(settingsRef, { ...settingsToSave, ownerId: user.uid }, { merge: true });
      setSettings(updatedSettings);
      
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        variant: "destructive",
        title: "Error Saving Settings",
        description: "Could not save your preferences. Please try again.",
      });
    }
  };

  const value = { settings, updateSettings, isLoading, hasSampleData, clearSampleData };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
