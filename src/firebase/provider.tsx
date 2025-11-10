
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { app } from './index';
import type { Analytics } from 'firebase/analytics';

export interface FirebaseContextValue {
  firebaseApp: typeof app;
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

export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
  analytics,
}: {
  children: ReactNode;
  firebaseApp: typeof app;
  auth: Auth;
  firestore: Firestore;
  analytics: Analytics | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [userError, setUserError] = useState<Error | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true); // Start as true

  useEffect(() => {
    // The listener that is at the heart of Firebase's auth system.
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        // This callback is triggered when the initial auth state is resolved,
        // and every time it changes.
        setUser(user);
        setUserError(null);
        setIsUserLoading(false); // Auth state is now confirmed.
      },
      (error) => {
        // This handles any errors during the auth state observation.
        console.error('Authentication Error:', error);
        setUser(null);
        setUserError(error);
        setIsUserLoading(false);
      }
    );

    // Unsubscribe from the listener when the component unmounts.
    return () => unsubscribe();
  }, [auth]);

  // **THE AUTH GATE**
  // While isUserLoading is true, we render a full-page loading indicator.
  // This physically prevents any of the child components (the actual app)
  // from rendering and attempting to fetch data before auth is ready.
  if (isUserLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#1a1a1a', color: 'white', fontFamily: 'sans-serif', fontSize: '1.2rem' }}>
        Loading Your Application...
      </div>
    );
  }

  return (
    <FirebaseContext.Provider
      value={{ firebaseApp, auth, firestore, analytics, user, isUserLoading, userError }}
    >
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

export const useAnalytics = (): Analytics | null => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useAnalytics must be used within a FirebaseProvider');
    }
    return context.analytics;
}
