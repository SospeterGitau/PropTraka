
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { DashboardNavigation } from '@/components/dashboard-navigation';
import { DataProvider } from '@/context/data-context';
import { SubscriptionChecker } from '@/components/subscription-checker';

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If auth is done loading and there's still no user, redirect to login.
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);
  
  // The FirebaseProvider now handles the main loading spinner.
  // We just need to prevent rendering anything if the user is not logged in.
  if (!user) {
    return null; 
  }
  
  // Once the user is confirmed, render the main dashboard content.
  return (
    <DataProvider>
      <DashboardNavigation>
        <SubscriptionChecker>
          {children}
        </SubscriptionChecker>
      </DashboardNavigation>
    </DataProvider>
  );
}
