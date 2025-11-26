'use client';

import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface AreaChartProps {
  data: DataPoint[];
}

export function AreaChart({ data }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="month" 
          className="text-xs"
          stroke="currentColor"
        />
        <YAxis 
          className="text-xs"
          stroke="currentColor"
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`KES ${value.toLocaleString()}`, '']}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stackId="1"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.6}
          name="Revenue"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stackId="2"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.6}
          name="Expenses"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
