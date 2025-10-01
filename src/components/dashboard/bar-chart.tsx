
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

// Helper to create a shorter, more readable address label
function getShortAddress(property: Property) {
    const address = property.addressLine1 || '';
    const parts = address.split(' ');
    if (parts.length <= 2) {
        return address;
    }

    const streetType = parts[parts.length - 1].toLowerCase();
    const abbreviations: { [key: string]: string } = {
        road: 'Rd',
        avenue: 'Ave',
        street: 'St',
        lane: 'Ln',
        drive: 'Dr',
        court: 'Ct',
        place: 'Pl',
        boulevard: 'Blvd',
    };
    
    const lastWord = parts[parts.length - 1];
    const abbreviatedType = abbreviations[streetType] || lastWord;
    
    // Join first 2 words (e.g., "123 Main") and the abbreviated type
    const shortAddress = [...parts.slice(0, 2), abbreviatedType].join(' ');

    return shortAddress;
}


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
      property: getShortAddress(property), // Use a shorter name for the label
      profit: profit > 0 ? profit : 0, // Don't show negative profit on this chart for clarity
    };
  });
  
  // Dynamically adjust height based on number of properties to prevent label overlap
  const baseHeight = 300;
  const heightPerProperty = properties.length > 5 ? 20 : 0;
  const dynamicHeight = baseHeight + (properties.length - 5) * heightPerProperty;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit by Property</CardTitle>
        <CardDescription>Year-to-date profit for each property</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: `${dynamicHeight}px` }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 75 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="property" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={1} // Prevents recharts from auto-calculating height and cutting off labels
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
