
'use client';

import { useMemo } from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Cell,
  ReferenceLine,
  Tooltip
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useDataContext } from '@/context/data-context';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface DataPoint {
  name: string;
  profit: number;
}

interface HorizontalBarChartProps {
  data: DataPoint[];
}

export function HorizontalBarChart({ data }: HorizontalBarChartProps) {
  const { settings } = useDataContext();
  const currency = settings?.currency || 'KES';
  const locale = settings?.locale || 'en-KE';

  const chartConfig = {
    profit: {
      label: 'Profit',
      color: 'hsl(var(--chart-1))',
    },
    loss: {
      label: 'Loss',
      color: 'hsl(var(--chart-2))',
    }
  };
  
  const domain = useMemo(() => {
    if (!data || data.length === 0) return [0, 0];
    const values = data.map(d => d.profit);
    const maxAbs = Math.max(...values.map(Math.abs));
    return [-maxAbs, maxAbs];
  }, [data]);

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <RechartsBarChart 
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        height={Math.max(data.length * 50, 200)}
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
          tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}K`}
          domain={domain}
        />
        
        <YAxis 
          dataKey="name"
          type="category"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={200}
          tick={{ 
            fill: 'hsl(var(--foreground))',
            fontSize: 12
          }}
          interval={0}
        />
        
        <Tooltip
          cursor={{ fill: 'hsl(var(--accent))', opacity: 0.1 }}
          content={
            <ChartTooltipContent
              labelKey="name"
              formatter={(value) => (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Profit:</span>
                  <span className={`font-semibold text-sm ${Number(value) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(Number(value), locale, currency)}
                  </span>
                </div>
              )}
            />
          }
        />
        
        <ReferenceLine 
          x={0} 
          stroke="hsl(var(--border))" 
          strokeWidth={1.5}
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
    </ChartContainer>
  );
}
