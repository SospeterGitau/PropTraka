'use client';

import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Cell,
  ReferenceLine
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useDataContext } from '@/context/data-context';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

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
      color: 'hsl(var(--chart-1))',
    },
    loss: {
      label: 'Loss',
      color: 'hsl(var(--chart-2))',
    }
  };

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <RechartsBarChart 
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 280, bottom: 5 }}
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
          style={{ fontSize: '12px' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}K`}
        />
        
        <YAxis 
          dataKey="name"
          type="category"
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '11px' }}
          tickLine={false}
          axisLine={false}
          width={270}
          tick={{ 
            fill: 'hsl(var(--foreground))',
            fontSize: 12
          }}
        />
        
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--primary))', opacity: 0.08 }}
          content={
            <ChartTooltipContent
              labelKey="name"
              formatter={(value) => (
                <div className="flex items-center gap-2">
                  <span className="text-on-surface-variant text-xs">Profit:</span>
                  <span className={`font-semibold text-sm ${Number(value) >= 0 ? 'text-success' : 'text-error'}`}>
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
