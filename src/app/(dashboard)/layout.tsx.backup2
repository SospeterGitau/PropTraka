'use client';

import { DataProvider } from '@/context/data-context';
import { DashboardNavigation } from '@/components/dashboard-navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { ChatBubble } from '@/components/chat-bubble';
import { SubscriptionChecker } from '@/components/subscription-checker';
import { AnalyticsProvider } from '@/firebase/analytics-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <AnalyticsProvider>
        <DashboardNavigation>
          <SubscriptionChecker>
            {children}
          </SubscriptionChecker>
        </DashboardNavigation>
        <FirebaseErrorListener />
        <ChatBubble />
      </AnalyticsProvider>
    </DataProvider>
  );
}
