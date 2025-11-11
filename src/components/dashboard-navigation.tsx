

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Building,
  Calendar,
  CircleAlert,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  LogOut,
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  Wrench,
  User,
  Sparkles,
  Landmark,
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    { href: '/faq', label: 'FAQ', icon: HelpCircle },
    { href: '/privacy', label: 'Privacy Policy', icon: Shield },
];

function UpgradeBanner() {
  const { settings } = useDataContext();
  const pathname = usePathname();

  if (settings.subscription?.plan !== 'Free' || pathname === '/settings') {
    return null;
  }
  
  return (
      <Alert className="mb-4 bg-primary/10 border-primary/50 text-primary-foreground">
        <Sparkles className="h-4 w-4" />
        <AlertDescription className="text-primary">
            You are on the Free Plan. <Link href="/settings" className="font-bold underline hover:text-primary/90">Upgrade to Pro</Link> to unlock AI-powered reports and more features.
        </AlertDescription>
      </Alert>
  )
}

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
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden w-full">
                <div className="flex items-center gap-2">
                  <Landmark className="w-8 h-8 text-primary" />
                  <span className="font-semibold text-lg">LeaseLync</span>
                </div>
            </div>
            <div className="hidden items-center gap-2 group-data-[collapsible=icon]:flex w-6 h-6 relative">
                <Landmark className="w-6 h-6 text-primary" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
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
             <SidebarGroupLabel>Analyze</SidebarGroupLabel>
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
          
           <SidebarGroup className="mt-auto">
             <SidebarGroupLabel>Help & Settings</SidebarGroupLabel>
             <SidebarMenu>
                {utilityNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        className="justify-start h-10"
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
          <UpgradeBanner />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    