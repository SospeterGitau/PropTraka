
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCollection, useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { Subscription } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

export function SubscriptionChecker({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const subscriptionsQuery = user ? query(collection(firestore, 'subscriptions'), where('ownerId', '==', user.uid)) : null;

  const { data: subscriptions, isLoading: isSubscriptionLoading } = useCollection<Subscription>(subscriptionsQuery);


  useEffect(() => {
    const isDataLoading = isUserLoading || isSubscriptionLoading;
    // Don't do anything while data is loading or if we are already on the settings page
    if (isDataLoading || pathname === '/settings') {
      return;
    }

    // REDIRECT LOGIC IS NOW DISABLED
    // If data is loaded and there are no subscriptions, redirect to settings
    // if (!isDataLoading && (!subscriptions || subscriptions.length === 0)) {
    //   router.replace('/settings');
    // }
  }, [subscriptions, isUserLoading, isSubscriptionLoading, router, pathname]);

  const isLoading = isUserLoading || isSubscriptionLoading;

  // While loading, show a full-screen spinner to prevent showing content prematurely
  // We still show loading on initial auth/sub check to prevent flashes of content
  if (isLoading && pathname !== '/settings') {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
