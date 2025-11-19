
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import type { ResidencyStatus, Subscription, UserSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from './theme-context';

interface DataContextValue {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: Omit<UserSettings, 'subscription' | 'theme'> = {
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
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<UserSettings>({ ...defaultSettings, subscription: null, theme: 'system' });
  const [isLoading, setIsLoading] = useState(true);

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
            userSettings = { ...defaultSettings, theme: 'system' } as UserSettings;
            await setDoc(settingsRef, { ...userSettings, ownerId: user.uid });
        }
        
        if (userSettings.theme) {
            setTheme(userSettings.theme);
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

        setSettings(userSettings);

    } catch (error) {
        console.error("Error fetching data:", error);
        setSettings({ ...defaultSettings, subscription: null, theme: 'system' });
    } finally {
        setIsLoading(false);
    }
  }, [user, firestore, setTheme]);

  useEffect(() => {
    if (!isAuthLoading && user) {
        fetchAppData();
    } else if (!isAuthLoading && !user) {
        setIsLoading(false);
    }
  }, [isAuthLoading, user, fetchAppData]);

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

      if (settingsToSave.theme) {
        setTheme(settingsToSave.theme);
      }
      
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        variant: "destructive",
        title: "Error Saving Settings",
        description: "Could not save your preferences. Please try again.",
      });
    }
  };

  const value = { settings, updateSettings, isLoading };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
