'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log('Setting up auth listener...');

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser?.email || 'no user');
      setUser(currentUser as any);
      setLoading(false);
      
      if (currentUser) {
        console.log('User logged in - redirecting to dashboard');
        router.replace('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#111827'
      }}>
        <div style={{ color: '#ffffff' }}>Checking authentication...</div>
      </div>
    );
  }

  // Don't show landing page if user exists (they'll be redirected)
  if (user) {
    return null;
  }

  // Landing page for non-authenticated users
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#111827',
      padding: '32px'
    }}>
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        maxWidth: '672px'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: '#ffffff'
        }}>
          Welcome to PropTraka
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#d1d5db',
          marginBottom: '32px'
        }}>
          The smart, simple way to manage your rental properties.
        </p>
        <Link
          href="/signin"
          style={{
            padding: '12px 32px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '500',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Login
        </Link>
      </main>
    </div>
  );
}
