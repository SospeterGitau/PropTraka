'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  History,
  Wrench,
} from 'lucide-react';

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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';

const coreNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/arrears', label: 'Arrears', icon: CircleAlert },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
];

const analysisNavItems = [
  { href: '/reports', label: 'Reports', icon: LineChart },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
];

const utilityNavItems = [
    { href: '/changelog', label: 'Changelog', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/faq', label: 'FAQ', icon: HelpCircle },
    { href: '/privacy', label: 'Privacy Policy', icon: Shield },
];

export function DashboardNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
        await auth.signOut();
    }
    router.push('/login');
  };

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
          <SidebarGroup>
            <SidebarGroupLabel>Core Operations</SidebarGroupLabel>
            <SidebarMenu>
                {coreNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="justify-start"
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
          </SidebarGroup>

          <SidebarGroup>
             <SidebarGroupLabel>Analysis & Reporting</SidebarGroupLabel>
             <SidebarMenu>
                {analysisNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="justify-start"
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
          </SidebarGroup>
          
           <SidebarMenu className="mt-auto">
            {utilityNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="justify-start text-sm h-10"
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
          <SidebarSeparator />
          <div className="p-2">
             <Button onClick={handleLogout} className="justify-start w-full text-base h-12" variant="ghost">
                <LogOut />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
              </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 bg-background/80 backdrop-blur-sm border-b md:hidden">
          <SidebarTrigger />
          <Button onClick={handleLogout} variant="ghost" size="icon">
            <LogOut />
            <span className="sr-only">Logout</span>
          </Button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
