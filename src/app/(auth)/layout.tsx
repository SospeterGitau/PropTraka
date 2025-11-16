
'use client';

import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
        <main className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
            {children}
        </main>
    </FirebaseClientProvider>
  );
}
