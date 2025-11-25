
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  let user, isAuthLoading;

  try {
    const userData = useUser();
    user = userData.user;
    isAuthLoading = userData.isAuthLoading;
  } catch (err) {
    console.error('useUser error:', err);
    setError('Auth initialization error');
  }

  useEffect(() => {
    if (user) {
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

  // Show nothing while checking auth or redirecting
  if (isAuthLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
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
