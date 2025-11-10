
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

function getShortAddress(property: Property) {
    const address = property.addressLine1 || '';
    const parts = address.split(' ');
    
    if (parts.length < 2) {
        return address;
    }

    const lastWord = parts[parts.length - 1];
    
    const abbreviations: { [key: string]: string } = {
        Road: 'Rd',
        Avenue: 'Ave',
        Street: 'St',
        Lane: 'Ln',
        Drive: 'Dr',
        Court: 'Ct',
        Place: 'Pl',
        Boulevard: 'Blvd',
        Close: 'Cl',
    };
    
    const lowerCaseLastWord = lastWord.charAt(0).toUpperCase() + lastWord.slice(1).toLowerCase();

    if (abbreviations[lowerCaseLastWord]) {
        const abbreviatedType = abbreviations[lowerCaseLastWord];
        const shortAddress = [...parts.slice(0, -1), abbreviatedType].join(' ');
        return shortAddress;
    }
    
    return address;
}


export function BarChartComponent({ properties, revenue, expenses }: BarChartProps) {
  const { settings } = useDataContext();
  const { currency, locale, residencyStatus } = settings;
  const currentYear = new Date().getFullYear();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  };
  
  const formatCurrencyForAxis = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  const chartData = properties.map(property => {
    const propertyRevenue = revenue
      .filter(t => t.propertyId === property.id && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + (t.amountPaid ?? 0), 0);
    
    const propertyExpenses = expenses
      .filter(t => t.propertyId === property.id && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const isTaxable = residencyStatus === 'resident' && property.propertyType === 'Domestic';
    const taxOnRevenue = isTaxable ? propertyRevenue * 0.075 : 0;
    const profit = propertyRevenue - propertyExpenses - taxOnRevenue;

    return { 
      property: getShortAddress(property),
      fullAddress: property.addressLine1,
      profit: profit > 0 ? profit : 0,
    };
  }).sort((a, b) => a.profit - b.profit); // Sort ascending for horizontal chart

  const dynamicHeight = `${Math.max(chartData.length * 40 + 80, 250)}px`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit by Property</CardTitle>
        <CardDescription>Year-to-date after-tax profit for each property</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: dynamicHeight }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => formatCurrencyForAxis(Number(value))} tickLine={false} axisLine={false}>
                 <Label value={`Profit (${currency})`} position="bottom" offset={10} fontSize={12} />
              </XAxis>
              <YAxis dataKey="property" type="category" width={150} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} interval={0} />
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
