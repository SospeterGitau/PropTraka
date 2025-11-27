
'use client';

import { 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useDataContext } from '@/context/data-context';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface DataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface AreaChartProps {
  data: DataPoint[];
}

export function AreaChart({ data }: AreaChartProps) {
  const { settings } = useDataContext();
  const { currency, locale } = settings;

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-4))",
    },
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-[300px]">
      <RechartsAreaChart 
        accessibilityLayer
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
      >
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.7}/>
            <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false}
        />
        
        <XAxis 
          dataKey="month" 
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.substring(0, 3)}
        />
        
        <YAxis 
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}K`}
        />
        
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--accent))', opacity: 0.1 }}
          content={
            <ChartTooltipContent
              labelKey="month"
              formatter={(value, name) => (
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: name === 'revenue' ? 'var(--color-revenue)' : 'var(--color-expenses)' }}/>
                    <span className="text-muted-foreground capitalize">{name}:</span>
                    <span className="font-semibold">{formatCurrency(Number(value), locale, currency)}</span>
                  </div>
              )}
            />
          }
        />
        
        <Legend
            iconType="square"
        />
        
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          name="Revenue"
          animationDuration={1000}
        />
        
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="var(--color-expenses)"
          strokeWidth={2}
          fill="url(#expensesGradient)"
          name="Expenses"
          animationDuration={1000}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
}
