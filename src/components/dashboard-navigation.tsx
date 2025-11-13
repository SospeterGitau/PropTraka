
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
    <div className="min-h-screen">
      {/* Main content area with generous bottom padding for mobile nav and chat bubble */}
      <main className="p-4 sm:p-6 lg:p-8 pb-32 sm:pb-28 md:pb-20">
        {children}
      </main>

      {/* Mobile navigation bar, fixed to the bottom */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-around h-20 max-w-screen-xl mx-auto">
          {navItems.map((item) => {
            const isActive = (item.href === '/dashboard' && pathname === item.href) || 
                             (pathname.startsWith(item.href) && item.href !== '/dashboard');

            return (
              <Link
                href={item.href}
                key={item.label}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 w-full h-full text-sm font-medium transition-all active:scale-95",
                  isActive
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-500 active:text-blue-600"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-b-full"></span>
                )}
                <item.icon className="h-7 w-7" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
