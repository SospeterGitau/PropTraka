"use client";

import { ReactNode } from 'react';
import { FirebaseClientProvider } from '../firebase/client-provider'; // Import our "Auth Gate"

// This is the new Client Component Wrapper
export function ClientProviderWrapper({ children }: { children: ReactNode }) {
  // This component is a "use client" component,
  // so it can safely render our provider.
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
