
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

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/menu', label: 'Menu', icon: Menu },
  { href: '/activity', label: 'Activity', icon: FileText },
  { href: '/settings', label: 'Account', icon: User },
];

export function DashboardNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="pb-16">
      {children}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/80 backdrop-blur-sm">
        <nav className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
             const isActive = pathname.startsWith(item.href);

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
