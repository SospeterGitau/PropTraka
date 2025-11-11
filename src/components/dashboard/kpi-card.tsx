
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type KpiCardProps = {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  variant?: 'default' | 'positive' | 'destructive';
};

export function KpiCard({ icon: Icon, title, value, description, variant = 'default' }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-lg sm:text-xl md:text-2xl font-bold break-words",
          variant === 'destructive' && 'text-destructive',
          variant === 'positive' && 'text-accent'
        )}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
