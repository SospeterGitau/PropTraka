import React, { useState } from 'react';
import { Link, usePathname, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Building,
  TrendingUp,
  Wrench,
  Plus,
  X,
  Home,
  FileText,
  Menu as MenuIcon,
  Building2,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';

interface DashboardNavigationProps {
  children: React.ReactNode;
}

export function DashboardNavigation({ children }: DashboardNavigationProps) {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const router = useRouter();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/properties', label: t('properties'), icon: Building },
    { href: '/revenue', label: t('revenue'), icon: TrendingUp },
    { href: '/maintenance', label: t('maintenance'), icon: Wrench },
  ];

  const addMenuItems = [
    { href: '/properties?action=add', label: 'New Property', icon: Home },
    { href: '/revenue/add', label: 'New Tenancy', icon: FileText },
    { href: '/expenses/add', label: 'New Expense', icon: TrendingUp }
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header - Uber Style */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          {/* Hamburger button - navigates to /menu */}
          <Link
            href="/menu"
            className="mr-4 inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
          >
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Menu</span>
          </Link>

          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">PropTraka</span>
          </div>

          <div className="ml-auto">
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 min-h-[44px]" // Ensure min height for touch
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {children}
      </main>

      {/* Mobile navigation bar with FAB - Uber Style */}
      <nav className="fixed inset-x-0 bottom-0 z-50 h-16 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="flex h-full items-center justify-center">
          <div className="flex h-full w-full max-w-md items-center justify-around">
            {navItems.slice(0, 2).map((item) => {
              const isActive = (pathname === '/' && item.href === '/dashboard') || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] px-1 text-[10px] transition-colors', // Enforce 48px height, slightly smaller text for fit
                    isActive
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-6 w-6" /> {/* Slightly larger icon */}
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* FAB - Floating Action Button */}
            <DropdownMenu open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full shadow-lg -translate-y-6"
                >
                  {isAddMenuOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="w-48 mb-2">
                {addMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setIsAddMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {navItems.slice(2, 4).map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] px-1 text-[10px] transition-colors',
                    isActive
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
