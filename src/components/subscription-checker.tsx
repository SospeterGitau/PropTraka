
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useDataContext } from '@/context/data-context';

export function SubscriptionChecker({ children }: { children: React.ReactNode }) {
  const { isLoading } = useDataContext();
  const pathname = usePathname();

  // While the DataContext is loading settings AND subscription, show a spinner.
  // This prevents any premature rendering of content that might depend on subscription status.
  // We exclude /settings because that page should always be accessible.
  if (isLoading && pathname !== '/settings') {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Once loading is complete, render the children.
  // The logic for displaying prompts (like the UpgradeBanner) is now handled
  // within the DashboardNavigation component, based on the loaded context data.
  return <>{children}</>;
}
