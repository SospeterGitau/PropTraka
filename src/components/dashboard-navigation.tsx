'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Calendar,
  CircleAlert,
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/arrears', label: 'Arrears', icon: CircleAlert },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
];

export function DashboardNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="shrink-0 md:hidden">
              <SidebarTrigger />
            </Button>
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Wallet className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold font-headline">RentVision</h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className="justify-start"
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="group-data-[collapsible=icon]:hidden">
          {/* Footer content can go here */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center h-14 px-4 bg-background/80 backdrop-blur-sm border-b md:hidden">
          <SidebarTrigger />
          <h2 className="ml-4 text-lg font-semibold font-headline">RentVision</h2>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
