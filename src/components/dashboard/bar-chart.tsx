'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DataPoint {
  name: string;
  profit: number;
}

interface BarChartProps {
  data: DataPoint[];
}

export function BarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="name" 
          className="text-xs"
          stroke="currentColor"
          angle={-45}
          textAnchor="end"
          height={80}
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
          formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Profit']}
        />
        <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.profit >= 0 ? '#10b981' : '#ef4444'}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
