
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { Property, Transaction } from '@/lib/types';
import { useDataContext } from '@/context/data-context';

interface BarChartProps {
  properties: Property[];
  revenue: Transaction[];
  expenses: Transaction[];
}

const chartConfig = {
  profit: {
    label: 'Profit',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function BarChartComponent({ properties, revenue, expenses }: BarChartProps) {
  const { formatCurrency, formatCurrencyForAxis } = useDataContext();
  const currentYear = new Date().getFullYear();

  const chartData = properties.map(property => {
    const propertyRevenue = revenue
      .filter(t => t.propertyId === property.id && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + (t.amountPaid ?? 0), 0);
    
    const propertyExpenses = expenses
      .filter(t => t.propertyId === property.id && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const profit = propertyRevenue - propertyExpenses;

    return { 
      property: property.addressLine1, // Use a shorter name for the label
      profit: profit > 0 ? profit : 0, // Don't show negative profit on this chart for clarity
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit by Property</CardTitle>
        <CardDescription>Year-to-date profit for each property</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="property" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                angle={-45}
                textAnchor="end"
              />
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
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} 
              />
              <Bar dataKey="profit" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
