
'use client';

import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useDataContext } from '@/context/data-context';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';


interface DataPoint {
  name: string;
  profit: number;
}

interface HorizontalBarChartProps {
  data: DataPoint[];
}

export function HorizontalBarChart({ data }: HorizontalBarChartProps) {
  const { settings } = useDataContext();
  const { currency, locale } = settings;

  const chartConfig = {
    profit: {
      label: 'Profit',
    },
  };

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 60, 200)}>
      <RechartsBarChart 
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--border))"
          opacity={0.3}
          horizontal={false}
        />
        
        <XAxis 
          type="number"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
        />
        
        <YAxis 
          dataKey="name"
          type="category"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={150}
          tick={{ fill: 'hsl(var(--foreground))' }}
        />
        
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--accent))', opacity: 0.1 }}
          content={
            <ChartTooltipContent
              labelKey="name"
              formatter={(value) => (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Profit:</span>
                  <span className={`font-bold ${Number(value) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(Number(value), locale, currency)}
                  </span>
                </div>
              )}
            />
          }
        />
        
        <Bar 
          dataKey="profit" 
          radius={[0, 4, 4, 0]}
          animationDuration={1000}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.profit >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))'}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
