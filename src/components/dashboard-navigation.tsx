
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Menu,
  FileText,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/(dashboard)/actions';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/menu', label: 'Menu', icon: Menu },
  { href: '/settings', label: 'Activity', icon: FileText, subNav: 'changelog' },
  { href: '/settings', label: 'Account', icon: User, subNav: '' },
];

export function DashboardNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isSettingsActive = (itemHref: string, subNav?: string) => {
    if (itemHref !== '/settings') return false;
    const isBaseSettings = pathname === '/settings';
    
    // The "Account" tab is active if we are on the base /settings page
    if (subNav === '') return isBaseSettings;
    
    // Other tabs would be checked differently, but for now we link changelog
    if (subNav === 'changelog') return isBaseSettings; // Or a more specific check if URL changes

    return false;
  };
  
  const getHref = (item: typeof navItems[0]) => {
      if (item.href === '/settings' && item.subNav) {
          return `${item.href}?tab=${item.subNav}`;
      }
      return item.href;
  }

  return (
    <div>
      {children}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/80 backdrop-blur-sm">
        <nav className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
             const isActive = item.href === '/settings' 
              ? isSettingsActive(item.href, item.subNav)
              : pathname.startsWith(item.href);

            return (
              <Link
                href={getHref(item)}
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
