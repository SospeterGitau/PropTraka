
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Initialize Firebase services on the client side, once per component tree.
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  // Initialize App Check only on the client side after the app is initialized.
  useEffect(() => {
    if (firebaseServices.firebaseApp) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          // For development, use a debug token. The SDK will automatically
          // look for the token in the console when this is true.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
          
          initializeAppCheck(firebaseServices.firebaseApp, {
            provider: new ReCaptchaV3Provider('6Lce_OYpAAAAAPc-PE2P23B2x7-SA5i1u2n-B1bI'), // Recaptcha site key for localhost
            isTokenAutoRefreshEnabled: true,
          });

        } else {
          // For production, use the reCAPTCHA provider with the site key.
          initializeAppCheck(firebaseServices.firebaseApp, {
            provider: new ReCaptchaV3Provider('6Lce_OYpAAAAAPc-PE2P23B2x7-SA5i1u2n-B1bI'), // Recaptcha site key for production
            isTokenAutoRefreshEnabled: true,
          });
        }
        console.log('App Check initialized successfully');
      } catch (error) {
        console.warn('App Check initialization failed (non-critical):', error);
        // Don't throw - allow app to continue without App Check
      }
    }
  }, [firebaseServices.firebaseApp]);

  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
