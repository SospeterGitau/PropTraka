
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [forceShow, setForceShow] = useState(false);

  let user, isAuthLoading;

  try {
    const userData = useUser();
    user = userData.user;
    isAuthLoading = userData.isAuthLoading;

    // Debug logging
    console.log('HomePage - Auth state:', { 
      user: user?.email || 'no user', 
      isAuthLoading,
      forceShow
    });
  } catch (err) {
    console.error('useUser error:', err);
    setError('Auth initialization error');
  }

  // Timeout to force show landing page after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Timeout reached - forcing landing page display');
      setForceShow(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      console.log('User detected - redirecting to dashboard');
      router.replace('/dashboard');
    }
  }, [user, router]);

  // Show error if something broke
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-8">
        <h1 className="text-3xl font-bold mb-4 text-red-500">Error</h1>
        <p className="text-white">{error}</p>
        <Link href="/signin" className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md">
          Try Sign In
        </Link>
      </div>
    );
  }

  // If user exists, show nothing while redirecting
  if (user) {
    return null;
  }

  // Show loading only if auth is loading AND timeout hasn't passed
  if (isAuthLoading && !forceShow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white mb-4">Loading...</div>
        <div className="text-gray-400 text-sm">Checking authentication...</div>
      </div>
    );
  }

  // Landing page for non-authenticated users
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-8">
      <main className="flex flex-col items-center justify-center text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 text-white">
          Welcome to PropTraka
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          The smart, simple way to manage your rental properties.
        </p>
        <Link href="/signin" className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-medium" >
          Login
        </Link>
      </main>
    </div>
  );
}
