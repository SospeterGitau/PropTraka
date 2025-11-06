
import { FirebaseClientProvider } from '@/firebase/client-provider';
import DashboardClientLayout from './dashboard-client-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <DashboardClientLayout>{children}</DashboardClientLayout>
    </FirebaseClientProvider>
  );
}
