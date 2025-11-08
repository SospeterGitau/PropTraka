
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Analytics } from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { getSdks, initializeFirebase } from './index';

// Define the shape of the context
interface FirebaseContextValue {
  auth: Auth;
  firestore: Firestore;
  analytics: Analytics | null;
  firebaseApp: FirebaseApp;
  user: User | null; // The authenticated user
  isUserLoading: boolean; // The new loading state
  userError: Error | null; // To hold any auth errors
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
  const [userError, setUserError] = useState<Error | null>(null);

  // This useEffect is the "Auth Gate"
  useEffect(() => {
    // The onAuthStateChanged listener is the "Bouncer"
    // It waits for Firebase to initialize and check for a user.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Set the user (or null if logged out)
      setIsUserLoading(false); // This is the "OK" signal
    }, (error) => {
      setUserError(error);
      setIsUserLoading(false);
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
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
        }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // The Club: The bouncer is done, and we can now safely render
  // the rest of the app, passing down the user (or null).
  return (
    <FirebaseContext.Provider value={{ auth, firestore, analytics, firebaseApp, user, isUserLoading, userError }}>
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

// Hook for accessing the user state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Custom hook to get user and auth loading state
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return {
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useAuth must be used within a FirebaseProvider");
  return context.auth;
};

export const useFirestore = (): Firestore => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirestore must be used within a FirebaseProvider");
  return context.firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error("useFirebaseApp must be used within a FirebaseProvider");
    return context.firebaseApp;
};

export const useAnalytics = (): Analytics | null => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error("useAnalytics must be used within a FirebaseProvider");
    return context.analytics;
};

export { FirebaseContext };
