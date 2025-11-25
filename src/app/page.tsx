'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Link from 'next/link';

export default function HomePage() {
const { user, isAuthLoading } = useUser();
const router = useRouter();

// DEBUG: Log the auth state
useEffect(() => {
console.log('🔍 AUTH STATE:', {
isAuthLoading,
hasUser: !!user,
userEmail: user?.email || 'none'
});
}, [user, isAuthLoading]);

useEffect(() => {
if (user) {
console.log('✅ User detected, redirecting to dashboard');
router.replace('/dashboard');
}
}, [user, router]);

// DEBUG: Show what we're rendering
console.log('🎨 RENDERING:', {
isAuthLoading,
hasUser: !!user,
willShowLandingPage: !isAuthLoading && !user
});

// Show spinner with message instead of blank screen
if (isAuthLoading) {
return (
<div className="flex flex-col items-center justify-center min-h-screen bg-background">
<div className="text-center">
<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
<p className="text-muted-foreground">Checking authentication...</p>
</div>
</div>
);
}

// If user exists, show spinner while redirecting
if (user) {
return (
<div className="flex flex-col items-center justify-center min-h-screen bg-background">
<div className="text-center">
<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
<p className="text-muted-foreground">Redirecting to dashboard...</p>
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
