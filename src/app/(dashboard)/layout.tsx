import type { ReactNode } from 'react';
import { DashboardNavigation } from '@/components/dashboard-navigation';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardNavigation>
      <header className="sticky top-0 z-10 flex items-center h-14 px-4 bg-background/80 backdrop-blur-sm border-b md:hidden">
        {/* Placeholder for mobile header content if needed */}
      </header>
      <main className="p-4 md:p-6 lg:p-8">{children}</main>
    </DashboardNavigation>
  );
}
