
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
              KES {entry.value.toLocaleString()}
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
              KES {((payload[0]?.value || 0) - (payload[1]?.value || 0)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function AreaChart({ data }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsAreaChart 
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          {/* Gradient for Revenue */}
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
          </linearGradient>
          {/* Gradient for Expenses */}
          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
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
        
        {/* Revenue Area - Green */}
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          name="Revenue"
          animationDuration={1000}
        />
        
        {/* Expenses Area - Red */}
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#expensesGradient)"
          name="Expenses"
          animationDuration={1000}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
