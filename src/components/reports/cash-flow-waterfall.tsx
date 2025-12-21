'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// cleaned up unused import
import { cn } from '@/lib/utils';

// Helper for currency if needed locally
const formatMoney = (amount: number, currency: string = 'KES') => {
    if (currency === 'KES') {
        return `KSh ${new Intl.NumberFormat('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`;
    }
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(amount);
};

interface WaterfallDataPoint {
    name: string;
    value: number;
    // Computed for waterfall visualization
    start?: number;
    end?: number;
    fill?: string;
    isTotal?: boolean;
}

interface CashFlowWaterfallProps {
    grossPotential: number;
    vacancyLoss: number;
    creditLoss: number;
    expenses: number;
    currency?: string;
    className?: string;
}

export function CashFlowWaterfall({
    grossPotential,
    vacancyLoss,
    creditLoss,
    expenses,
    currency = 'KES',
    className
}: CashFlowWaterfallProps) {

    const data = useMemo(() => {
        // 1. Gross Potential (Positive)
        // 2. Vacancy Loss (Negative)
        // 3. Arrears/Credit Loss (Negative)
        // 4. Effective Gross Income (Total so far)
        // 5. Operating Expenses (Negative)
        // 6. Net Operating Income (Final Total)

        const effectiveGrossIncome = grossPotential - vacancyLoss - creditLoss;
        const netOperatingIncome = effectiveGrossIncome - expenses;

        // We need to structure this for a floating bar chart
        // Recharts doesn't have a native waterfall, so we use stacked bars with transparent segments or range bars
        // Using range bars [min, max] is easier with Recharts Bar.

        const chartData: any[] = [
            {
                step: 'Gross Potential',
                value: grossPotential,
                uv: [0, grossPotential], // [start, end]
                color: 'hsl(var(--chart-1))', // Blue/Primary
                label: formatMoney(grossPotential, currency)
            },
            {
                step: 'Vacancy Loss',
                value: -vacancyLoss,
                uv: [grossPotential - vacancyLoss, grossPotential],
                color: 'hsl(var(--chart-2))', // Red/Orange
                label: `-${formatMoney(vacancyLoss, currency)}`
            },
            {
                step: 'Credit Loss',
                value: -creditLoss,
                uv: [grossPotential - vacancyLoss - creditLoss, grossPotential - vacancyLoss],
                color: 'hsl(var(--chart-2))',
                label: `-${formatMoney(creditLoss, currency)}`
            },
            {
                step: 'Effective Income',
                value: effectiveGrossIncome,
                uv: [0, effectiveGrossIncome],
                color: 'hsl(var(--chart-3))', // Green/Teal
                isResult: true,
                label: formatMoney(effectiveGrossIncome, currency)
            },
            {
                step: 'Expenses',
                value: -expenses,
                uv: [effectiveGrossIncome - expenses, effectiveGrossIncome],
                color: 'hsl(var(--chart-5))', // Yellow/Warning
                label: `-${formatMoney(expenses, currency)}`
            },
            {
                step: 'NOI',
                value: netOperatingIncome,
                uv: [0, netOperatingIncome],
                color: 'hsl(var(--chart-4))', // Purple?
                isResult: true,
                label: formatMoney(netOperatingIncome, currency)
            }
        ];

        return chartData;
    }, [grossPotential, vacancyLoss, creditLoss, expenses, currency]);

    // Efficiency Ratio
    const efficiency = grossPotential > 0 ? ((grossPotential - vacancyLoss - creditLoss) / grossPotential) * 100 : 0;

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Operating Cash Flow</CardTitle>
                        <CardDescription>Waterfall analysis of income efficiency</CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Efficiency Ratio</p>
                        <p className={cn("text-2xl font-bold", efficiency > 90 ? "text-green-600" : efficiency > 80 ? "text-yellow-600" : "text-red-600")}>
                            {efficiency.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="step" axisLine={false} tickLine={false} />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(val)}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                                                <p className="font-semibold mb-1">{data.step}</p>
                                                <p className={cn("text-lg", data.value < 0 ? "text-red-500" : "text-green-500")}>
                                                    {formatMoney(Math.abs(data.value), currency)}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="uv" radius={[4, 4, 4, 4]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                                <LabelList dataKey="label" position="top" className="fill-foreground text-xs" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
