"use client";

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
  isUserLoading: boolean;
  userError: Error | null;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const functions = getFunctions(app);
  const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsUserLoading(false);
    }, (error) => {
        console.error("Authentication error:", error);
        setUserError(error);
        setIsUserLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  if (isUserLoading) {
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
    <FirebaseContext.Provider value={{ auth, firestore, functions, analytics, user, isUserLoading: isUserLoading, userError }}>
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
  const context = useFirebase();
  return { 
      user: context.user, 
      isUserLoading: context.isUserLoading, 
      userError: context.userError 
    };
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useAnalytics = () => {
    const { analytics } = useFirebase();
    return analytics;
}

export interface UserHookResult {
    user: User | null;
    isUserLoading: boolean;
    userError: Error | null;
}
