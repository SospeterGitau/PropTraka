
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

// This component handles the root routing logic.
// If a user is logged in, it redirects them to the main dashboard.
// Otherwise, it redirects them to the sign-in page.
export default function RootPage() {
    const { user, isAuthLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading) {
            if (user) {
                // User is logged in, go to the main dashboard (which is at the root of the (dashboard) group)
                router.replace('/dashboard');
            } else {
                // User is not logged in, go to the sign-in page
                router.replace('/signin');
            }
        }
    }, [user, isAuthLoading, router]);

    // Display a loading spinner while checking the auth state.
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
}
