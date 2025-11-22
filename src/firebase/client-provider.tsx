
'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // State to track if App Check is ready
  const [isAppCheckReady, setIsAppCheckReady] = useState(false);

  // Initialize Firebase services on the client side, once per component tree.
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  // Initialize App Check only on the client side after the app is initialized.
  useEffect(() => {
    if (firebaseServices.firebaseApp) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          // For development, use a debug token.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
          
          initializeAppCheck(firebaseServices.firebaseApp, {
            provider: new ReCaptchaV3Provider('6Lce_OYpAAAAAPc-PE2P23B2x7-SA5i1u2n-B1bI'),
            isTokenAutoRefreshEnabled: true,
          });

        } else {
          // For production, use the reCAPTCHA provider with the site key.
          initializeAppCheck(firebaseServices.firebaseApp, {
            provider: new ReCaptchaV3Provider('6Lce_OYpAAAAAPc-PE2P23B2x7-SA5i1u2n-B1bI'),
            isTokenAutoRefreshEnabled: true,
          });
        }
        console.log('App Check initialized successfully.');
      } catch (error) {
        console.warn('App Check initialization failed (non-critical):', error);
      } finally {
        // Mark App Check as ready regardless of success or failure to avoid blocking the app
        setIsAppCheckReady(true);
      }
    }
  }, [firebaseServices.firebaseApp]);

  return (
    <FirebaseProvider>
      {/* Only render children after App Check has attempted initialization */}
      {isAppCheckReady ? children : <div>Loading...</div>}
    </FirebaseProvider>
  );
}
