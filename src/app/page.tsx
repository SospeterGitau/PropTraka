'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function AppStoreBadge() {
    return (
        <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" aria-label="Download on the App Store" className="inline-block hover:opacity-80 transition-opacity" >
            <svg width="120" height="40" viewBox="0 0 120 40" className="rounded-lg">
                <rect width="120" height="40" rx="5" fill="black"/>
                <text x="24" y="12" fill="white" fontSize="9" fontFamily="Arial, sans-serif">
                    Download on the
                </text>
                <text x="24" y="27" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">
                    App Store
                </text>
                <path d="M 10 20 L 14 16 L 10 12 M 10 20 L 14 24 L 10 28" fill="none" stroke="white" strokeWidth="1.5" />
            </svg>
        </a>
    );
}

function GooglePlayBadge() {
    return (
        <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" aria-label="Get it on Google Play" className="inline-block hover:opacity-80 transition-opacity" >
            <svg width="135" height="40" viewBox="0 0 135 40" className="rounded-lg">
                <rect width="135" height="40" rx="5" fill="black" />
                <text x="40" y="14" fill="white" fontSize="8" fontFamily="Arial, sans-serif">
                    GET IT ON
                </text>
                <text x="40" y="29" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">
                    Google Play
                </text>
                <path d="M 15 10 L 25 20 L 15 30 L 10 26 L 17 20 L 10 14 Z" fill="white" />
            </svg>
        </a>
    );
}


export default function HomePage() {
  const { user, isAuthLoading } = useUser();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Only redirect if a user exists and we are not already in the process of redirecting
    if (user && !redirecting) {
      setRedirecting(true);
      router.replace('/dashboard');
    }
  }, [user, router, redirecting]);

  // Show a spinner while auth state is loading
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  // If there's a user but we haven't redirected yet, show spinner to prevent content flash
  if (user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If auth is done and there's no user, show the landing page
  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <main className="flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to PropTraka</h1>
          <p className="text-xl text-muted-foreground mb-8">
            The smart, simple way to manage your rental properties.
          </p>
          <div className="flex gap-4 mb-8">
            <Button size="lg" asChild>
              <Link href="/signin">Login</Link>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
              <AppStoreBadge />
              <GooglePlayBadge />
          </div>
        </main>
      </div>
  );
}
