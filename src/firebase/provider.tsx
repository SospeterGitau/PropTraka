'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Define the shape of the context
interface FirebaseContextValue {
  auth: Auth;
  firestore: Firestore;
  analytics: Analytics | null;
  firebaseApp: FirebaseApp;
  user: User | null; // The authenticated user
  isUserLoading: boolean; // The new loading state
}

// Create the context with a default undefined value
const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

// The new, correct Provider component
export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
  analytics,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  analytics: Analytics | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true); // Start as true

  // This useEffect is the "Auth Gate"
  useEffect(() => {
    // The onAuthStateChanged listener is the "Bouncer"
    // It waits for Firebase to initialize and check for a user.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Set the user (or null if logged out)
      setIsUserLoading(false); // This is the "OK" signal
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]); // Run this effect only once

  // THE GATE: While the bouncer is checking the ID, show a loader.
  if (isUserLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: '#1a1a1a',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        Loading Application...
      </div>
    );
  }

  // The Club: The bouncer is done, and we can now safely render
  // the rest of the app, passing down the user (or null).
  return (
    <FirebaseContext.Provider value={{ auth, firestore, analytics, firebaseApp, user, isUserLoading }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

// Custom hook to use the context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

// Custom hook to just get the user (often used in components)
export const useUser = () => {
  const { user, isUserLoading } = useFirebase();
  return { user, isUserLoading };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
    const { firebaseApp } = useFirebase();
    return firebaseApp;
};

export const useAnalytics = (): Analytics | null => {
    const { analytics } = useFirebase();
    return analytics;
};
