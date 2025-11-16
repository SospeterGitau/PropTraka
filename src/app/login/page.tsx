
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is obsolete and will be removed.
// It now redirects to the new sign-in page.
export default function ObsoleteLoginPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/signin');
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
}
