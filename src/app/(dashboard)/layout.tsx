
import DashboardClientLayout from './dashboard-client-layout';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { ChatBubble } from '@/components/chat-bubble';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <DashboardClientLayout>
        {children}
        <FirebaseErrorListener />
        <ChatBubble />
      </DashboardClientLayout>
  );
}
