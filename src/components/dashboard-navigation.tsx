'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Menu, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardNavigationProps {
  children: React.ReactNode;
}

export function DashboardNavigation({ children }: DashboardNavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/menu', label: 'Menu', icon: Menu },
    { href: '/activity', label: 'Activity', icon: FileText },
    { href: '/settings', label: 'Account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
        {children}
      </main>

      {/* Mobile navigation bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 h-16 border-t bg-background/95 backdrop-blur-sm sm:hidden">
        <div className="flex h-full items-center justify-around">
          {navItems.map((item) => {
            const isActive = (item.href === '/dashboard' && pathname === item.href) || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link
                href={item.href}
                key={item.label}
                className={cn(
                  "relative flex h-full w-full flex-col items-center justify-center gap-1 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {isActive && <span className="absolute top-0 h-0.5 w-12 rounded-full bg-primary" />}
                <item.icon className="h-6 w-6" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
