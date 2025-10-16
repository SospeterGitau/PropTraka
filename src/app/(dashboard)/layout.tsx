
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { DashboardNavigation } from '@/components/dashboard-navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If auth is not loading and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  // While loading, you can show a loader or a blank screen.
  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If user is authenticated, render the dashboard layout.
  return <DashboardNavigation>{children}</DashboardNavigation>;
}
