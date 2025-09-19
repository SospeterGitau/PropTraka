'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartData = [
  { property: '123 Maple', profit: 9500 },
  { property: '456 Oak', profit: 11200 },
  { property: '789 Pine', profit: 7800 },
  { property: '101 Elm', profit: 14500 },
  { property: '212 Birch', profit: 8900 },
  { property: '333 Cedar', profit: 18000 },
  { property: '444 Spruce', profit: 10500 },
];

const chartConfig = {
  profit: {
    label: 'Profit',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function BarChartComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit by Property</CardTitle>
        <CardDescription>Year-to-date profit for each property</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="property" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} />
              <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
