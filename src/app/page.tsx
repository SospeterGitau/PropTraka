
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <main className="flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to RentVision</h1>
        <p className="text-xl text-muted-foreground mb-8">
          The smart, simple way to manage your rental properties.
        </p>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
