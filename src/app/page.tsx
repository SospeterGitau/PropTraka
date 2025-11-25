'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

export default function HomePage() {
  const { user, isAuthLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (user && !redirecting) {
      console.log('🔄 Starting redirect to dashboard');
      setRedirecting(true);

      // Add a timeout to prevent infinite redirect
      const timeoutId = setTimeout(() => {
        router.push('/dashboard');
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [user, router, redirecting]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('✅ Logged out successfully');
      window.location.reload();
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Show loading state
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state with logout option
  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Redirecting to dashboard...</p>
          <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground underline" >
            Or click here to logout
          </button>
        </div>
      </div>
    );
  }

  // Landing page for non-authenticated users
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <main className="flex flex-col items-center justify-center text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 text-foreground">
          Welcome to PropTraka
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          The smart, simple way to manage your rental properties.
        </p>
        <Link href="/signin" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 text-base" >
          Login
        </Link>
      </main>
    </div>
  );
}
