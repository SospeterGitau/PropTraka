
import { DashboardNavigation } from '@/components/dashboard-navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { ChatBubble } from '@/components/chat-bubble';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardNavigation>
      <main className="p-4 sm:p-6 lg:p-8 pb-24">
        {children}
        <FirebaseErrorListener />
        <ChatBubble />
      </main>
    </DashboardNavigation>
  );
}
