
import { FirebaseClientProvider } from '@/firebase/client-provider';
import DashboardClientLayout from './dashboard-client-layout';
import { ChatBubble } from '@/components/chat-bubble';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <DashboardClientLayout>
        {children}
        <ChatBubble />
      </DashboardClientLayout>
      <FirebaseErrorListener />
    </FirebaseClientProvider>
  );
}
