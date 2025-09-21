import type { ReactNode } from 'react';
import { DashboardNavigation } from '@/components/dashboard-navigation';
import { DataProvider } from '@/context/data-context';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <DashboardNavigation>
        {children}
      </DashboardNavigation>
    </DataProvider>
  );
}
