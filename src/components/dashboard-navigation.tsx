
'use client';

import { ReactNode, useRef, useLayoutEffect } from 'react';
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
  const mainRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const applyPadding = () => {
      if (mainRef.current && navRef.current) {
        // Only apply padding on mobile screens where the nav bar is visible
        if (window.innerWidth < 640) { // 640px is Tailwind's default 'sm' breakpoint
          const navHeight = navRef.current.offsetHeight;
          mainRef.current.style.paddingBottom = `${navHeight}px`;
        } else {
          mainRef.current.style.paddingBottom = '0px';
        }
      }
    };

    applyPadding();

    window.addEventListener('resize', applyPadding);
    return () => window.removeEventListener('resize', applyPadding);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Main content area, now with a ref */}
      <main ref={mainRef} className="p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile navigation bar, fixed to the bottom, now with a ref */}
      <nav ref={navRef} className="sm:hidden fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
             const isActive = (item.href === '/dashboard' && pathname === item.href) || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                href={item.href}
                key={item.label}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full text-sm font-medium transition-colors relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full"></span>}
                <item.icon className="h-6 w-6" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  );
}
