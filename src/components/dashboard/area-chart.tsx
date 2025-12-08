'use client';

import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDataContext } from '@/context/data-context';

type AreaChartProps = {
  data: Array<{
    date: string;
    revenue: number;
    expenses: number;
  }>;
};

export function AreaChart({ data }: AreaChartProps) {
  const { settings } = useDataContext();
  
  // ✅ Add null safety
  const currency = settings?.currency || 'KES';
  const locale = settings?.locale || 'en-KE';

  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: '#10b981',
    },
    expenses: {
      label: 'Expenses',
      color: '#ef4444',
    },
  };

  const formatCurrencyValue = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(value) => formatCurrencyValue(value as number)} />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={chartConfig.revenue.color}
          fill={chartConfig.revenue.color}
          name={chartConfig.revenue.label}
          isAnimationActive={true}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke={chartConfig.expenses.color}
          fill={chartConfig.expenses.color}
          name={chartConfig.expenses.label}
          isAnimationActive={true}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
