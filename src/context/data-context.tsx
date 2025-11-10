
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { ResidencyStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export interface UserSettings {
  currency: string;
  locale: string;
  companyName: string;
  residencyStatus: ResidencyStatus;
  isPnlReportEnabled: boolean;
  isMarketResearchEnabled: boolean;
}

interface DataContextValue {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: UserSettings = {
  currency: 'KES',
  locale: 'en-GB',
  companyName: 'My Property Portfolio',
  residencyStatus: 'resident',
  isPnlReportEnabled: true,
  isMarketResearchEnabled: true,
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const settingsRef = doc(firestore, 'userSettings', user.uid);
    try {
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        setSettings({ ...defaultSettings, ...docSnap.data() });
      } else {
        // No settings found, create with defaults
        await setDoc(settingsRef, { ...defaultSettings, ownerId: user.uid });
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
      setSettings(defaultSettings); // Fallback to defaults on error
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    const settingsRef = doc(firestore, 'userSettings', user.uid);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await setDoc(settingsRef, updatedSettings, { merge: true });
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
