
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDataContext } from '@/context/data-context';
import { Loader2 } from 'lucide-react';

export function SubscriptionChecker({ children }: { children: React.ReactNode }) {
  const { subscriptions, isDataLoading } = useDataContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't do anything while data is loading or if we are already on the settings page
    if (isDataLoading || pathname === '/settings') {
      return;
    }

    // If data is loaded and there are no subscriptions, redirect to settings
    if (!isDataLoading && (!subscriptions || subscriptions.length === 0)) {
      router.replace('/settings');
    }
  }, [subscriptions, isDataLoading, router, pathname]);
  
  // While loading, show a full-screen spinner to prevent showing content prematurely
  if (isDataLoading && pathname !== '/settings') {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // If we are on a page other than settings and there's no subscription, show loading
  // This prevents a flash of content before the redirect happens.
  if (pathname !== '/settings' && (!subscriptions || subscriptions.length === 0)) {
     return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
