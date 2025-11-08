
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
    // If auth is done loading and there's still no user, redirect to login.
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);
  
  // No need for a loading spinner here anymore, because the FirebaseProvider now handles that.
  // If there's no user after loading, we'll redirect (or show nothing until redirect happens).
  if (!user) {
    return null; 
  }
  
  // Once the user is confirmed, render the main dashboard content.
  return (
    <DataProvider>
      <DashboardNavigation>
        {children}
      </DashboardNavigation>
    </DataProvider>
  );
}
