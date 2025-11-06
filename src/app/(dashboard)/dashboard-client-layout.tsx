
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { DashboardNavigation } from '@/components/dashboard-navigation';
import { DataProvider } from '@/context/data-context';

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If auth is not loading and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  // While loading auth state, or if there is no user, show a loader.
  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If user is authenticated, render the dashboard layout with data.
  return (
    <DataProvider>
      <DashboardNavigation>{children}</DashboardNavigation>
    </DataProvider>
  );
}
