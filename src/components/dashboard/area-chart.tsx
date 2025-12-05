'use client';

import { 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useDataContext } from '@/context/data-context';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

interface DataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface AreaChartProps {
  data: DataPoint[];
}

// Custom Tooltip Component
const CustomChartTooltip = ({ active, payload, label, currency, locale }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2.5 h-2.5 rounded-[2px]" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-bold" style={{ color: entry.color }}>
              {formatCurrency(entry.value, locale, currency)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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
      color: "hsl(var(--chart-2))",
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
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
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
        
        <Tooltip 
          content={<CustomChartTooltip currency={currency} locale={locale} />}
          cursor={{ fill: 'hsl(var(--accent))', opacity: 0.1 }}
        />
        
        <ChartLegend content={<ChartLegendContent />} />
        
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          name="Revenue"
          animationDuration={1000}
          isAnimationActive={true}
        />
        
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          fill="url(#expensesGradient)"
          name="Expenses"
          animationDuration={1000}
          isAnimationActive={true}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
}
