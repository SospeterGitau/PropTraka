
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Building,
  Calendar,
  CircleAlert,
  CreditCard,
  HelpCircle,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
  User,
} from 'lucide-react';
import { logout } from '@/app/(dashboard)/actions';
import { useDataContext } from '@/context/data-context';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const coreNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/arrears', label: 'Arrears', icon: CircleAlert },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/contractors', label: 'Contractors', icon: Users },
];

const analysisNavItems = [
  { href: '/reports', label: 'Reports', icon: LineChart },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
];

const utilityNavItems = [
    { href: '/settings', label: 'Account', icon: User },
    { href: '/changelog', label: 'Changelog', icon: History },
    { href: '/faq', label: 'FAQ', icon: HelpCircle },
    { href: '/privacy', label: 'Privacy Policy', icon: Shield },
];

export function DashboardNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { logoUrl, companyName } = useDataContext();
  
  const isValidDataUri = logoUrl && logoUrl.startsWith('data:image/');

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="shrink-0 md:hidden">
              <SidebarTrigger />
            </Button>
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden w-full">
              {isValidDataUri ? (
                <div className="w-[140px] h-[40px] relative">
                  <Image
                    src={logoUrl}
                    alt={`${companyName} Logo`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Building className="w-8 h-8 text-primary" />
                  <span className="font-semibold text-lg">{companyName}</span>
                </div>
              )}
            </div>
            <div className="hidden items-center gap-2 group-data-[collapsible=icon]:flex w-6 h-6 relative">
              {isValidDataUri ? (
                <Image
                  src={logoUrl}
                  alt={`${companyName} Logo`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <Building className="w-6 h-6 text-primary" />
              )}
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
                    isActive={pathname.startsWith(item.href)}
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
          <div className="p-2 h-[56px] flex items-center">
            <form action={logout}>
              <SidebarMenuButton variant="ghost" className="w-full justify-start h-10" tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </form>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center justify-start h-14 px-4 bg-background/80 backdrop-blur-sm border-b md:hidden">
          <SidebarTrigger />
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
