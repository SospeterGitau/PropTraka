'use client';

import { FirebaseClientProvider } from "../../src/firebase/client-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
        <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
            {children}
        </div>
    </FirebaseClientProvider>
  );
}
