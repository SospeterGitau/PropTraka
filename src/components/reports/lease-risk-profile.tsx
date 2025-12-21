'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { addMonths, differenceInMonths, isAfter, isBefore, parseISO, format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Tenancy, Transaction } from '@/lib/types';

// --- Lease Expiry Profile ---

interface LeaseExpiryChartProps {
    tenancies: Tenancy[];
    className?: string;
}

export function LeaseExpiryChart({ tenancies, className }: LeaseExpiryChartProps) {
    const data = useMemo(() => {
        const today = new Date();
        const buckets = Array.from({ length: 12 }, (_, i) => {
            const date = addMonths(today, i);
            return {
                month: format(date, 'MMM yyyy'),
                dateObj: date,
                count: 0,
                tenants: [] as string[]
            };
        });

        tenancies.forEach(t => {
            if (t.status === 'Active' && t.endDate) {
                // Check if end date is within next 12 months
                const endDate = new Date(t.endDate);
                const monthsDiff = differenceInMonths(endDate, today);

                if (monthsDiff >= 0 && monthsDiff < 12) {
                    buckets[monthsDiff].count++;
                    buckets[monthsDiff].tenants.push(t.tenantName || 'Unknown');
                }
            }
        });

        return buckets;
    }, [tenancies]);

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>Lease Expiry Profile</CardTitle>
                <CardDescription>Upcoming lease ends over the next 12 months.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const item = payload[0].payload;
                                        return (
                                            <div className="bg-background border rounded p-2 shadow-sm text-xs">
                                                <p className="font-bold">{label}</p>
                                                <p className="mb-1">{item.count} expiring</p>
                                                {item.tenants.length > 0 && (
                                                    <ul className="list-disc pl-4 text-muted-foreground">
                                                        {item.tenants.map((t: string, i: number) => <li key={i}>{t}</li>)}
                                                    </ul>
                                                )}
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Arrears Ageing Breakdown ---

interface ArrearsValues {
    "0-30 Days": number;
    "31-60 Days": number;
    "61-90 Days": number;
    "90+ Days": number;
}

interface ArrearsAgeingChartProps {
    transactions: Transaction[]; // Can accept mixed, we filter inside
    currency?: string;
    className?: string;
}

const ARREARS_COLORS = ['#fbbf24', '#f97316', '#ef4444', '#7f1d1d']; // Amber, Orange, Red, Dark Red

export function ArrearsAgeingChart({ transactions, currency = 'KES', className }: ArrearsAgeingChartProps) {
    const data = useMemo(() => {
        const today = new Date();
        const overdue = transactions.filter(t =>
            // Check it's an income transaction (or has status 'Overdue' etc)
            // Guard: 'amountPaid' exists on RevenueTransaction usually.
            // Also checking type explicitly if available.
            (t as any).status !== 'Paid' &&
            ((t as any).type === 'income' || (t as any).type === 'revenue' || (t as any).amountPaid !== undefined)
        );

        const buckets = [
            { name: "0-30 Days", value: 0 },
            { name: "31-60 Days", value: 0 },
            { name: "61-90 Days", value: 0 },
            { name: "90+ Days", value: 0 },
        ];

        overdue.forEach(t => {
            const dueDate = new Date(t.date);
            // Calculate days overdue
            const diffTime = Math.abs(today.getTime() - dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Only count if actually past due (diffDays > 0 and dueDate < today)
            if (isBefore(dueDate, today)) {
                const amount = (t.amount || 0) - ((t as any).amountPaid || 0); // Outstanding amount
                if (amount <= 0) return;

                if (diffDays <= 30) buckets[0].value += amount;
                else if (diffDays <= 60) buckets[1].value += amount;
                else if (diffDays <= 90) buckets[2].value += amount;
                else buckets[3].value += amount;
            }
        });

        return buckets.filter(b => b.value > 0); // Only show non-empty for clean pie
    }, [transactions]);

    const totalArrears = data.reduce((sum, b) => sum + b.value, 0);

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>Arrears Ageing</CardTitle>
                <CardDescription>Breakdown of overdue rent by duration.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full relative">
                    {totalArrears === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground flex-col">
                            <p>No arrears found.</p>
                            <p className="text-sm">Great job!</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={ARREARS_COLORS[index % ARREARS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(value)}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                    {totalArrears > 0 && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-bold text-lg">{new Intl.NumberFormat('en-KE', { style: 'currency', currency, compactDisplay: "short", notation: "compact" }).format(totalArrears)}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
