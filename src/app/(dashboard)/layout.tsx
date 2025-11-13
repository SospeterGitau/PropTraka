
'use client';

import { DataProvider } from '@/context/data-context';
import { DashboardNavigation } from '@/components/dashboard-navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { ChatBubble } from '@/components/chat-bubble';
import { SubscriptionChecker } from '@/components/subscription-checker';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <DashboardNavigation>
        <main className="p-4 sm:p-6 lg:p-8">
          <SubscriptionChecker>
            {children}
          </SubscriptionChecker>
          <FirebaseErrorListener />
        </main>
      </DashboardNavigation>
      <ChatBubble />
    </DataProvider>
  );
}
