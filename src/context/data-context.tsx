
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser, useFirebase } from '@/firebase';
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
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user || !firestore) return; // Guard against uninitialized user/firestore
    
    setIsLoading(true);
    const settingsRef = doc(firestore, 'userSettings', user.uid);
    try {
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        setSettings({ ...defaultSettings, ...docSnap.data() });
      } else {
        // No settings found, create with defaults for the logged-in user
        await setDoc(settingsRef, { ...defaultSettings, ownerId: user.uid });
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
      // Fallback to defaults on error, but do not attempt to write again
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    // Only fetch settings when the user is authenticated and not loading
    if (!isUserLoading && user) {
        fetchSettings();
    } else if (!isUserLoading && !user) {
        // If auth is done and there's no user, we are done loading.
        setIsLoading(false);
    }
  }, [isUserLoading, user, fetchSettings]);

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
