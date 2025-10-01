
'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { subMonths, format, startOfMonth, isSameMonth } from 'date-fns';
import type { ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';
import { useDataContext } from '@/context/data-context';

interface AreaChartProps {
  revenue: Transaction[];
  expenses: Transaction[];
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  expenses: {
    label: 'Expenses',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export function AreaChartComponent({ revenue, expenses }: AreaChartProps) {
  const { formatCurrency, formatCurrencyForAxis } = useDataContext();
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const month = format(d, 'MMMM');
    const monthStart = startOfMonth(d);

    const monthlyRevenue = revenue
      .filter(t => isSameMonth(new Date(t.date), monthStart))
      .reduce((sum, t) => sum + (t.amountPaid ?? 0), 0);
    
    const monthlyExpenses = expenses
      .filter(t => isSameMonth(new Date(t.date), monthStart))
      .reduce((sum, t) => sum + t.amount, 0);

    return { month, revenue: monthlyRevenue, expenses: monthlyExpenses };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>Revenue vs. Expenses for the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickFormatter={(value) => formatCurrencyForAxis(Number(value))} tickLine={false} axisLine={false} />
              <Tooltip 
                content={<ChartTooltipContent 
                    formatter={(value, name) => (
                    <div className="flex flex-col">
                        <span className="text-muted-foreground">{name}</span>
                        <span>{formatCurrency(Number(value))}</span>
                    </div>
                )}
                />}
              />
              <Area type="monotone" dataKey="expenses" stroke="hsl(var(--chart-4))" fillOpacity={1} fill="url(#colorExpenses)" />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
