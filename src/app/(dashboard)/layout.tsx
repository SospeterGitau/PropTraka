
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { DashboardNavigation } from '@/components/dashboard-navigation';
import { DataProvider } from '@/context/data-context';
import { logout, getSession } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect('/login');
  }
  
  return (
    <DataProvider>
      <DashboardNavigation>
        <header className="sticky top-0 z-10 flex items-center justify-end h-14 px-4 bg-background/80 backdrop-blur-sm border-b md:hidden">
          <form action={logout}>
            <Button type="submit" variant="ghost" size="icon">
              <LogOut />
              <span className="sr-only">Logout</span>
            </Button>
          </form>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </DashboardNavigation>
    </DataProvider>
  );
}
