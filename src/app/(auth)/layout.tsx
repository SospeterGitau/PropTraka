
'use client';

import { FirebaseProvider } from "@/firebase/provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseProvider>
        <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
            {children}
        </div>
    </FirebaseProvider>
  );
}
