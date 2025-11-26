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

interface DataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface AreaChartProps {
  data: DataPoint[];
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  const { settings } = useDataContext();
  const { currency, locale } = settings;

  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">
              {formatCurrency(entry.value, locale, currency)}
            </span>
          </div>
        ))}
        <div className="border-t mt-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Net:</span>
            <span className={`font-bold ${
              (payload[0]?.value || 0) - (payload[1]?.value || 0) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {formatCurrency((payload[0]?.value || 0) - (payload[1]?.value || 0), locale, currency)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function AreaChart({ data }: AreaChartProps) {
  const { settings } = useDataContext();
  const { currency, locale } = settings;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsAreaChart 
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          {/* Gradient for Revenue - Blue */}
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
          </linearGradient>
          {/* Gradient for Expenses - Yellow/Gold */}
          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.7}/>
            <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--border))"
          opacity={0.3}
        />
        
        <XAxis 
          dataKey="month" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
        />
        
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
        
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        
        {/* Revenue Area - Blue */}
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          name="Revenue"
          animationDuration={1000}
        />
        
        {/* Expenses Area - Yellow/Gold */}
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

    