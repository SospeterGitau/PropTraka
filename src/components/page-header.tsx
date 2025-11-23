import type { ReactNode } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 mb-8 border-b">
        <div className="flex items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
            {children}
            <Button variant="outline" size="icon" asChild>
                <Link href="/menu">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">More</span>
                </Link>
            </Button>
        </div>
    </div>
  );
}
