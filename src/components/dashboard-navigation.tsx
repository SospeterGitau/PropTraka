
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
  LineChart,
  Settings,
  LogOut,
  HelpCircle,
  Shield,
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
import { logout } from '@/app/(dashboard)/actions';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/arrears', label: 'Arrears', icon: CircleAlert },
  { href: '/reports', label: 'Financial Reports', icon: LineChart },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
];

const secondaryNavItems = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/faq', label: 'FAQ', icon: HelpCircle },
    { href: '/privacy', label: 'Privacy Policy', icon: Shield },
]

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
                  className="justify-start text-base h-12"
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <span className="inline-flex items-center justify-center w-6 h-6">
                      <item.icon />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
           <SidebarMenu className="mt-auto">
            {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="justify-start text-base h-12"
                    tooltip={item.label}
                    >
                    <Link href={item.href}>
                        <span className="inline-flex items-center justify-center w-6 h-6">
                        <item.icon />
                        </span>
                        <span>{item.label}</span>
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
           </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <form action={logout}>
            <div className="p-2">
               <Button type="submit" className="justify-start w-full text-base h-12" variant="ghost">
                  <LogOut />
                  <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                </Button>
            </div>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 bg-background/80 backdrop-blur-sm border-b md:hidden">
          <SidebarTrigger />
          <form action={logout}>
            <Button type="submit" variant="ghost" size="icon">
              <LogOut />
              <span className="sr-only">Logout</span>
            </Button>
          </form>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
