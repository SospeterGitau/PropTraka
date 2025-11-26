'use client';

import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

interface DataPoint {
  name: string;
  profit: number;
}

interface HorizontalBarChartProps {
  data: DataPoint[];
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs">
        <p className="text-sm font-semibold mb-1">{payload[0].payload.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Profit:</span>
          <span className={`font-bold ${value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            KES {value.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function HorizontalBarChart({ data }: HorizontalBarChartProps) {
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
        
        <Tooltip content={<CustomTooltip />} />
        
        <Bar 
          dataKey="profit" 
          radius={[0, 4, 4, 0]}
          animationDuration={1000}
        >
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
