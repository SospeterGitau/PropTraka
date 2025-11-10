
import { FirebaseProvider } from '@/firebase/provider';
import DashboardClientLayout from './dashboard-client-layout';
import { ChatBubble } from '@/components/chat-bubble';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseProvider>
      <DashboardClientLayout>
        {children}
        <ChatBubble />
      </DashboardClientLayout>
    </FirebaseProvider>
  );
}
