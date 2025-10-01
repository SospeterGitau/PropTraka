
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Label } from 'recharts';
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
    
    if (parts.length < 2) {
        return address;
    }

    const lastWord = parts[parts.length - 1];
    const streetType = lastWord.toLowerCase();
    
    const abbreviations: { [key: string]: string } = {
        road: 'Rd',
        avenue: 'Ave',
        street: 'St',
        lane: 'Ln',
        drive: 'Dr',
        court: 'Ct',
        place: 'Pl',
        boulevard: 'Blvd',
        close: 'Cl',
    };
    
    if (abbreviations[streetType]) {
        const abbreviatedType = abbreviations[streetType];
        const shortAddress = [...parts.slice(0, -1), abbreviatedType].join(' ');
        return shortAddress;
    }
    
    return address;
}


export function BarChartComponent({ properties, revenue, expenses }: BarChartProps) {
  const { formatCurrency, formatCurrencyForAxis, currency } = useDataContext();
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
      property: getShortAddress(property),
      fullAddress: property.addressLine1, // Pass full address for tooltip
      profit: profit > 0 ? profit : 0,
    };
  }).sort((a, b) => a.profit - b.profit); // Sort data for better visual flow
  
  // Dynamically adjust height based on number of properties to prevent label overlap
  const baseHeight = 150; // Base height for the chart
  const heightPerProperty = 40; // Pixels per bar
  const dynamicHeight = baseHeight + (chartData.length * heightPerProperty);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit by Property</CardTitle>
        <CardDescription>Year-to-date profit for each property</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: `${dynamicHeight}px` }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis 
                type="number" 
                tickFormatter={(value) => formatCurrencyForAxis(Number(value))}
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
              >
                <Label value={`Profit (${currency})`} position="bottom" offset={10} fontSize={12} />
              </XAxis>
              <YAxis 
                type="category"
                dataKey="property" 
                width={150} // Allocate space for labels
                tickLine={false} 
                axisLine={false}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <Tooltip 
                content={<ChartTooltipContent 
                    formatter={(value, name, props) => {
                      return (
                        <div className="flex flex-col">
                            <span className="font-bold">{props.payload.fullAddress}</span>
                            <div className="flex justify-between">
                               <span className="text-muted-foreground capitalize">{name}: &nbsp;</span>
                               <span>{formatCurrency(Number(value))}</span>
                            </div>
                        </div>
                      )
                    }}
                />} 
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} 
              />
              <Bar dataKey="profit" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
