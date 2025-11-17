'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import type { Metadata } from 'next';

function HomePageContent() {
  const { user, isAuthLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <main className="flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to LeaseLync</h1>
        <p className="text-xl text-muted-foreground mb-8">
          The smart, simple way to manage your rental properties.
        </p>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/signin">Login</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  // Although metadata is not used in a 'use client' component directly,
  // we keep this structure in case this component is wrapped or for reference.
  // Next.js will handle metadata from the nearest server component parent or layout.
  
  return (
    <FirebaseClientProvider>
      <HomePageContent />
    </FirebaseClientProvider>
  );
}
