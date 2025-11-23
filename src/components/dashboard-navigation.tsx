
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building, TrendingUp, Wrench, Plus, X, Home, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardNavigationProps {
  children: React.ReactNode;
}

export function DashboardNavigation({ children }: DashboardNavigationProps) {
  const pathname = usePathname();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/properties', label: 'Properties', icon: Building },
    { href: '/revenue', label: 'Revenue', icon: TrendingUp },
    { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  ];

  const addMenuItems = [
    { href: '/properties/add', label: 'New Property', icon: Home },
    { href: '/revenue/add', label: 'New Tenancy', icon: FileText },
    { href: '/expenses/add', label: 'New Expense', icon: TrendingUp }
  ];


  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {children}
      </main>

      {/* Mobile navigation bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 h-16 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="flex h-full items-center justify-center">
          <div className="flex h-full w-full max-w-md items-center justify-around">
            {navItems.slice(0, 2).map((item) => {
              const isActive = (pathname === '/' && item.href === '/dashboard') || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 text-sm font-medium transition-colors h-full w-16",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Central Add Button */}
            <DropdownMenu open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className={cn(
                    "rounded-full w-16 h-16 -mt-8 shadow-xl flex items-center justify-center transition-transform duration-300",
                    isAddMenuOpen ? "scale-105 rotate-45 bg-destructive" : "scale-100"
                  )}
                >
                  {isAddMenuOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                  <span className="sr-only">Add Item</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="w-56 mb-4">
                 {addMenuItems.map(item => (
                    <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                        </Link>
                    </DropdownMenuItem>
                 ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {navItems.slice(2).map((item) => {
               const isActive = (pathname === '/' && item.href === '/dashboard') || (item.href !== '/' && pathname.startsWith(item.href));
               return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 text-sm font-medium transition-colors h-full w-16",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
