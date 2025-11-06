
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import { DashboardNavigation } from '@/components/dashboard-navigation';
import { DataProvider, useDataContext } from '@/context/data-context';

function SubscriptionChecker({ children }: { children: React.ReactNode }) {
  const { subscriptions, isDataLoading } = useDataContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If we are on the subscription page already, do nothing.
    if (pathname === '/settings/subscription') {
      return;
    }

    // Wait until data is loaded
    if (isDataLoading) {
      return;
    }

    // If data is loaded and there are no subscriptions, redirect
    if (!isDataLoading && (!subscriptions || subscriptions.length === 0)) {
      router.replace('/settings/subscription');
    }
  }, [subscriptions, isDataLoading, router, pathname]);
  
  // If we are on the subscription page, always show it.
  if (pathname === '/settings/subscription') {
      return <>{children}</>;
  }

  // While loading or if user has a subscription, show the content
  if (isDataLoading || (subscriptions && subscriptions.length > 0)) {
    return <>{children}</>;
  }

  // If redirecting, show a loader
  return (
     <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
  )
}


export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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
