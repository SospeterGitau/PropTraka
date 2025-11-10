"use client"; // <-- THIS IS THE CRITICAL FIX
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { app } from './index';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export interface FirebaseContextValue {
  auth: Auth;
  firestore: Firestore;
  analytics: Analytics | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export type UserHookResult = {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
};


const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userError, setUserError] = useState<Error | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setUserError(null);
        setIsUserLoading(false);
      },
      (error) => {
        console.error('Authentication Error:', error);
        setUser(null);
        setUserError(error);
        setIsUserLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  if (isUserLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#1a1a1a', color: 'white', fontFamily: 'sans-serif', fontSize: '1.2rem' }}>
        Loading Your Application...
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ firebaseApp: app, auth, firestore, analytics, user, isUserLoading, userError }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = (): FirebaseContextValue => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useAnalytics = (): Analytics | null => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useAnalytics must be used within a FirebaseProvider');
    }
    return context.analytics;
}