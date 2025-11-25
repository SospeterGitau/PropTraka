'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Link from 'next/link';

export default function HomePage() {
const { user, isAuthLoading } = useUser();
const router = useRouter();

useEffect(() => {
// Redirect authenticated users to dashboard
if (user) {
router.replace('/dashboard');
}
}, [user, router]);

// Show nothing while checking auth or redirecting
if (isAuthLoading || user) {
return null;
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
