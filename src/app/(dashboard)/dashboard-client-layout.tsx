
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { DashboardNavigation } from '@/components/dashboard-navigation';
import { SubscriptionChecker } from '@/components/subscription-checker';
import { ThemeProvider } from '@/context/theme-context';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // The main loading spinner is now handled by the FirebaseProvider.
    // This effect simply handles the redirect if auth is ready and there's no user.
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  // If auth is still loading, the provider shows a spinner.
  // If auth is done and there's no user, we'll be redirected, so we can return null.
  if (isUserLoading || !user) {
    return null;
  }

  // Once the user is confirmed, render the main dashboard content.
  return (
    <DashboardNavigation>
      <SubscriptionChecker>{children}</SubscriptionChecker>
    </DashboardNavigation>
  );
}


export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
        <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>
  )
}
