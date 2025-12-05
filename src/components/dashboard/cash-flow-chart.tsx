'use client';

import { 
  AreaChart as RechartsAreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDataContext } from '@/context/data-context';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DataPoint {
  month: string;
  revenue: number;
  expenses: number;
  netCashFlow: number;
}

interface CashFlowChartProps {
  data: DataPoint[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { settings } = useDataContext();
  const { currency, locale } = settings;

  const chartConfig = {
    netCashFlow: {
      label: "Net Cash Flow",
      color: "hsl(var(--color-primary))",
    },
  };

  const trend = data.length >= 2 
    ? data[data.length - 1].netCashFlow - data[0].netCashFlow 
    : 0;
  const trendDirection = trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable';
  const trendPercentage = data.length >= 2 && data[0].netCashFlow !== 0
    ? ((trend / Math.abs(data[0].netCashFlow)) * 100).toFixed(1)
    : '0';

  const totalCashFlow = data.reduce((sum, d) => sum + d.netCashFlow, 0);
  const avgMonthly = totalCashFlow / data.length;
  const maxFlow = Math.max(...data.map(d => d.netCashFlow));
  const minFlow = Math.min(...data.map(d => d.netCashFlow));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Cash Flow Analysis</h3>
        <p className="text-sm text-muted-foreground mt-1">6-month trend analysis for financial planning</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "flex items-center gap-2 text-lg font-bold",
              trendDirection === 'improving' ? 'text-green-600' :
              trendDirection === 'declining' ? 'text-red-600' :
              'text-muted-foreground'
            )}>
              {trendDirection === 'improving' ? (
                <TrendingUp className="h-5 w-5 flex-shrink-0" />
              ) : trendDirection === 'declining' ? (
                <TrendingDown className="h-5 w-5 flex-shrink-0" />
              ) : (
                <Minus className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="truncate">{trendDirection === 'improving' ? 'Improving' : trendDirection === 'declining' ? 'Declining' : 'Stable'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">6-month direction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg/Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-lg font-bold truncate",
              avgMonthly >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(avgMonthly, locale, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Average monthly</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total 6M</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-lg font-bold truncate",
              totalCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(totalCashFlow, locale, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Total 6 months</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[280px]">
            <RechartsAreaChart 
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--color-primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--color-primary))" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--color-border))"
                vertical={false}
              />
              
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--color-muted-foreground))"
                style={{ fontSize: '12px' }}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.substring(0, 3)}
              />
              
              <YAxis 
                stroke="hsl(var(--color-muted-foreground))"
                style={{ fontSize: '12px' }}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}K`}
              />
              
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--color-primary))', opacity: 0.1 }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value), locale, currency)}
                  />
                }
              />

              <Area
                type="monotone"
                dataKey="netCashFlow"
                stroke="hsl(var(--color-primary))"
                fill="url(#cashflowGradient)"
                strokeWidth={2}
                animationDuration={1000}
              />
            </RechartsAreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Peak cash flow:</span>
            <span className="font-semibold text-green-600">{formatCurrency(maxFlow, locale, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Low point:</span>
            <span className="font-semibold text-red-600">{formatCurrency(minFlow, locale, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">6-month change:</span>
            <span className={cn(
              "font-semibold",
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {trend >= 0 ? '+' : ''}{trendPercentage}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span>💡</span>
            Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {trendDirection === 'improving' 
              ? 'Strong positive trend - maintain current expense management practices and consider reinvestment'
              : trendDirection === 'declining'
              ? 'Review expense categories and consider operational optimization to improve profitability'
              : 'Stable cash flow - monitor for changes and maintain vigilance on recurring expenses'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
