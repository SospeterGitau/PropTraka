'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface ReportsRevenueChartProps {
    data: any[];
    currency: string;
    locale: string;
}

export function ReportsRevenueChart({ data, currency, locale }: ReportsRevenueChartProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    };

    const formatCurrencyForAxis = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
        return amount.toString();
    };

    return (
        <ChartContainer config={{}} className="h-[350px] w-full">
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis
                        tickFormatter={(value) => formatCurrencyForAxis(Number(value))}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        content={<ChartTooltipContent
                            formatter={(value, name) => (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground capitalize">{name === 'grossPotential' ? 'Gross Potential' : 'Net Income'}</span>
                                    <span>{formatCurrency(Number(value))}</span>
                                </div>
                            )}
                        />}
                        cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
                    />
                    <Legend />
                    <Bar dataKey="grossPotential" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name="Gross Potential" />
                    <Bar dataKey="netIncome" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Net Income" />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
