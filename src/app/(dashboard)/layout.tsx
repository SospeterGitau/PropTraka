
'use client';


import { DashboardNavigation } from '@/components/dashboard-navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { ChatBubble } from '@/components/chat-bubble';
import { SubscriptionProvider } from '@/components/subscription-checker';
import { AnalyticsProvider } from '@/firebase/analytics-provider';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user] = useAuthState(auth);

  return (
    <AnalyticsProvider>
      <SubscriptionProvider user={user}>
        <DashboardNavigation>{children}</DashboardNavigation>
        <FirebaseErrorListener />
        <ChatBubble />
      </SubscriptionProvider>
    </AnalyticsProvider>
  );
}
