
'use client';

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { useFitText } from '@/hooks/use-fit-text';
import { useDataContext } from '@/context/data-context';

type KpiCardProps = {
  icon: LucideIcon;
  title: string;
  value: number;
  description: string;
  variant?: 'default' | 'positive' | 'destructive';
};

export function KpiCard({ icon: Icon, title, value, description, variant = 'default' }: KpiCardProps) {
  const { fontSize, ref } = useFitText();
  const { settings } = useDataContext();
  const { currency, locale } = settings;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div 
          ref={ref}
          style={{ fontSize }}
          className={cn(
            "font-bold whitespace-nowrap",
            variant === 'destructive' && 'text-destructive',
            variant === 'positive' && 'text-accent'
          )}
        >
          {formatCurrency(value, locale, currency)}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
