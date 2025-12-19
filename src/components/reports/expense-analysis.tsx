'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Expense } from '@/lib/types';

interface ExpenseAnalysisProps {
    expenses: Expense[];
    currency?: string;
    className?: string;
}

// Colors for categories
const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--destructive))',
    '#8884d8',
    '#82ca9d'
];

export function ExpenseAnalysisChart({ expenses, currency = 'KES', className }: ExpenseAnalysisProps) {

    const processedData = useMemo(() => {
        // Group by month and then by category
        const monthlyData: Record<string, any> = {};
        const categories = new Set<string>();

        expenses.forEach(exp => {
            const date = exp.date ? (exp.date.toDate ? exp.date.toDate() : new Date(exp.date)) : new Date();
            const monthKey = format(date, 'MMM yy'); // e.g., "Jan 24"
            const category = exp.category || 'Uncategorized';

            categories.add(category);

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { name: monthKey, total: 0 };
            }

            if (!monthlyData[monthKey][category]) {
                monthlyData[monthKey][category] = 0;
            }

            monthlyData[monthKey][category] += exp.amount;
            monthlyData[monthKey].total += exp.amount;
        });

        // Convert to array
        const chartData = Object.values(monthlyData);
        const categoryList = Array.from(categories);

        return { chartData, categoryList };
    }, [expenses]);

    const { chartData, categoryList } = processedData;

    const formatMoney = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency, compactDisplay: "short", notation: "compact" }).format(val);

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>Expense Forensics</CardTitle>
                <CardDescription>Monthly breakdown by category to identify anomalies.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    {chartData.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">No expense data for this period</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={formatMoney} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--accent))', opacity: 0.1 }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-background border rounded-lg p-3 shadow-lg text-xs">
                                                    <p className="font-bold mb-2">{label}</p>
                                                    {payload.map((entry: any, index: number) => (
                                                        <div key={index} className="flex justify-between gap-4 mb-1">
                                                            <span style={{ color: entry.color }}>{entry.name}:</span>
                                                            <span className="font-mono">{new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(entry.value)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                                                        <span>Total:</span>
                                                        <span>{new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(payload.reduce((sum: number, entry: any) => sum + (entry.value as number), 0))}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                {categoryList.map((cat, index) => (
                                    <Bar
                                        key={cat}
                                        dataKey={cat}
                                        stackId="a"
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
