
import DashboardClientLayout from './dashboard-client-layout';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <DashboardClientLayout>
        {children}
        <FirebaseErrorListener />
      </DashboardClientLayout>
  );
}
