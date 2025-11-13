
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { app } from './index';

interface FirebaseContextValue {
  auth: Auth;
  firestore: Firestore;
  functions: Functions;
  analytics: Analytics | null;
  user: User | null;
  isAuthLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const functions = getFunctions(app);
  const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  if (isAuthLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#1a1a1a',
        color: 'white',
        fontFamily: 'sans-serif',
        fontSize: '1.2rem'
      }}>
        Loading Your Application...
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ auth, firestore, functions, analytics, user, isAuthLoading }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useUser = () => {
  const { user, isAuthLoading } = useFirebase();
  return { user, isUserLoading };
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useAnalytics = () => {
  const { analytics } = useFirebase();
  return analytics;
};
