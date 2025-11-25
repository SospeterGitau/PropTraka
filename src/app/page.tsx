'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';

export default function DashboardPage() {
const router = useRouter();
const [userEmail, setUserEmail] = useState<string | null>(null);
const [checking, setChecking] = useState(true);

useEffect(() => {
// Set a timeout to show content after 1 second regardless of Firebase state
const timeout = setTimeout(() => {
setChecking(false);
}, 1000);

// Try to get auth state, but don't block on it
const unsubscribe = onAuthStateChanged(auth, (user) => {
  if (user) {
    setUserEmail(user.email);
    setChecking(false);
    clearTimeout(timeout);
  } else {
    // No user after checking - redirect to signin
    router.push('/signin');
  }
}, (error) => {
  // If there's an error, just show content anyway
  console.error('Auth state error:', error);
  setChecking(false);
  clearTimeout(timeout);
});

return () => {
  unsubscribe();
  clearTimeout(timeout);
};
}, [router]);

const handleLogout = async () => {
try {
const { signOut } = await import('firebase/auth');
await signOut(auth);
router.push('/');
} catch (error) {
console.error('Logout error:', error);
// Force redirect anyway
router.push('/');
}
};

// Show minimal loading for just 1 second max
if (checking) {
return (
<div className="flex items-center justify-center min-h-screen bg-background">
<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
</div>
);
}

// Show dashboard immediately after 1 second
return (
<div className="min-h-screen bg-background">
<header className="border-b border-gray-700 bg-gray-900">
<div className="container mx-auto px-4 py-4 flex items-center justify-between">
<h1 className="text-2xl font-bold text-white">PropTraka Dashboard</h1>
<button onClick={handleLogout} className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors" >
Logout
</button>
</div>
</header>

  <main className="container mx-auto px-4 py-8">
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2 text-white">
        Welcome back{userEmail ? `, ${userEmail}` : ''}!
      </h2>
      <p className="text-gray-400">
        This is your PropTraka dashboard.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
        <h3 className="font-semibold mb-2 text-white">Properties</h3>
        <p className="text-2xl font-bold text-white">0</p>
        <p className="text-sm text-gray-400">Total properties</p>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
        <h3 className="font-semibold mb-2 text-white">Tenants</h3>
        <p className="text-2xl font-bold text-white">0</p>
        <p className="text-sm text-gray-400">Active tenants</p>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
        <h3 className="font-semibold mb-2 text-white">Revenue</h3>
        <p className="text-2xl font-bold text-white">KES 0</p>
        <p className="text-sm text-gray-400">This month</p>
      </div>
    </div>
  </main>
</div>
);
}
