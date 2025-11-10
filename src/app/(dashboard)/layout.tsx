
import DashboardClientLayout from './dashboard-client-layout';
import { ChatBubble } from '@/components/chat-bubble';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <DashboardClientLayout>
        {children}
        <ChatBubble />
        <FirebaseErrorListener />
      </DashboardClientLayout>
  );
}
