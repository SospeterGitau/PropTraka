
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Menu,
  FileText,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/(dashboard)/actions';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, subNav: 'dashboard' },
  { href: '/menu', label: 'Menu', icon: Menu, subNav: 'menu' },
  { href: '/settings?tab=changelog', label: 'Activity', icon: FileText, subNav: 'changelog' },
  { href: '/settings', label: 'Account', icon: User, subNav: 'account' },
];

export function DashboardNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isSettingsActive = (itemSubNav?: string) => {
    if (pathname !== '/settings') return false;
    const currentTab = searchParams.get('tab');

    if (itemSubNav === 'account') {
        // "Account" is active if we are on /settings and the tab is 'profile' or not set at all.
        return currentTab === 'profile' || currentTab === null || currentTab === 'subscription' || currentTab === 'knowledge';
    }
    
    if (itemSubNav === 'changelog') {
        // "Activity" is active if the tab is 'changelog'
        return currentTab === 'changelog';
    }

    return false;
  };

  return (
    <div>
      {children}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/80 backdrop-blur-sm">
        <nav className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
             const isActive = item.href.startsWith('/settings')
              ? isSettingsActive(item.subNav)
              : pathname.startsWith(item.href);

            return (
              <Link
                href={item.href}
                key={item.label}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
