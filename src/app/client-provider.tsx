"use client";

import { ReactNode } from 'react';
import { FirebaseProvider } from '../firebase/provider'; 

export function ClientProviderWrapper({ children }: { children: ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}