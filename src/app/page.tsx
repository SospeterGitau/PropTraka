
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function AppStoreBadge() {
    return (
        <a href="#" aria-label="Download on the App Store">
            <svg width="120" height="40" viewBox="0 0 120 40" className="rounded-lg">
                <rect width="120" height="40" rx="5" fill="black"/>
                <g fill="white">
                    <path d="M10.8,20.3c0,2.5-1.9,4.4-4.4,4.4s-4.4-1.9-4.4-4.4s1.9-4.4,4.4-4.4S10.8,17.8,10.8,20.3z M6.4,16.4c-2.2,0-3.9,1.8-3.9,3.9s1.8,3.9,3.9,3.9s3.9-1.8,3.9-3.9S8.6,16.4,6.4,16.4z"/>
                    <path d="M20.3,24.3h-2.1l-2.4-3.9l-2.4,3.9h-2.1l3.5-5.5l-3.3-5.2h2.1l2.2,3.6l2.2-3.6h2.1l-3.3,5.2L20.3,24.3z"/>
                    <path d="M21.5,19.3v5h-1.6V14h2.9c1.4,0,2.4,1,2.4,2.4c0,1.1-0.6,1.9-1.5,2.2l1.7,2.7H25l-1.5-2.5H23v0H21.5z M23,15.5h-1.5v2.3H23c0.7,0,1.2-0.5,1.2-1.2C24.2,16,23.7,15.5,23,15.5z"/>
                    <path d="M35.1,19.9c0-1.5-0.9-2.3-2.3-2.3c-0.8,0-1.4,0.4-1.8,0.8l-0.1-0.7h-1.5v8.5h1.6v-4.4c0-1.4,0.8-2.2,1.9-2.2c1,0,1.6,0.7,1.6,2v4.6h1.6V19.9z"/>
                    <path d="M42.7,24.3h-1.6l-3.2-8.3h1.7l2.4,6.6l2.4-6.6h1.7L42.7,24.3z"/>
                    <path d="M52.3,24.3h-1.6l-3.2-8.3h1.7l2.4,6.6l2.4-6.6h1.7L52.3,24.3z"/>
                    <path d="M58.7,14h1.6v10.3h-1.6V14z"/>
                    <path d="M68.6,19.1v-5.1h-1.6v10.3h1.6v-5.2c0-1.4,0.7-2.1,1.8-2.1c0.2,0,0.5,0,0.6,0.1v-1.6C72,15.4,69.9,15.1,68.6,19.1z"/>
                    <path d="M78,14h1.7l2.5,8.1L84.6,14h1.7v10.3h-1.6V16.1l-2.4,7.8h-1.1l-2.4-7.8v8.2H78V14z"/>
                    <path d="M89.7,17.6c-1.4-1.4-3.2-1.9-4.9-1.9c-2.8,0-5,1.7-6.3,3.4C27,20.9,26.1,23.5,26.1,26.4c0,3.2,1,6,2.6,8c1.3,1.6,3.3,2.5,5.5,2.5c0.7,0,1.5-0.1,2.2-0.4c0.8-0.3,1.6-0.8,2.5-1.5c-1.2-0.8-2.1-2-2.3-3.4H35c-1.9,0-3.3-1.5-3.3-3.4s1.5-3.4,3.3-3.4h5.6C40,22.3,39.7,20.2,89.7,17.6z M36.7,27.8c0,1,0.7,1.8,1.8,1.8c1,0,1.8-0.8,1.8-1.8s-0.7-1.8-1.8-1.8C37.4,26,36.7,26.8,36.7,27.8z"/>
                    <text x="32" y="10" font-size="6" font-family="Arial, sans-serif">Download on the</text>
                    <text x="32" y="18" font-size="10" font-weight="bold" font-family="Arial, sans-serif">App Store</text>
                </g>
            </svg>
        </a>
    );
}

function GooglePlayBadge() {
    return (
        <a href="#" aria-label="Get it on Google Play">
            <svg width="135" height="40" viewBox="0 0 135 40" className="rounded-lg">
                <rect width="135" height="40" rx="5" fill="black" />
                <g fill="white">
                    <path d="M22.2,16.8l-6.2,6.2l6.2,6.2c0.2,0.2,0.2,0.6,0,0.8l-0.8,0.8c-0.2,0.2-0.6,0.2-0.8,0l-7-7c-0.2-0.2-0.2-0.6,0-0.8l7-7c0.2-0.2,0.6-0.2,0.8,0l0.8,0.8C22.4,16.2,22.4,16.6,22.2,16.8z" transform="translate(5, -4) scale(1.4)" />
                    <text x="40" y="14" font-size="8" font-family="Arial, sans-serif">GET IT ON</text>
                    <text x="40" y="29" font-size="14" font-weight="bold" font-family="Arial, sans-serif">Google Play</text>
                </g>
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
