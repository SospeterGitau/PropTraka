
'use client';

import { 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useDataContext } from '@/context/data-context';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

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
    <ResponsiveContainer width="100%" height={300}>
      <RechartsAreaChart 
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.7}/>
            <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--border))"
          vertical={false}
        />
        
        <XAxis 
          dataKey="month" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.substring(0, 3)}
        />
        
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
        />
        
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--accent))', opacity: 0.1 }}
          content={
            <ChartTooltipContent
              labelKey="month"
              formatter={(value, name) => (
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: name === 'revenue' ? chartConfig.revenue.color : chartConfig.expenses.color }}/>
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
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          name="Revenue"
          animationDuration={1000}
        />
        
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="hsl(var(--chart-4))"
          strokeWidth={2}
          fill="url(#expensesGradient)"
          name="Expenses"
          animationDuration={1000}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
