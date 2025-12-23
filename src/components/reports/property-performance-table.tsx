'use client';

import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUpDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Property } from '@/lib/types';

interface PropertyMetric extends Property {
    netYield: number;
    expenseRatio: number; // 0-1
    maintenanceCost: number;
    occupancyStatus: 'Occupied' | 'Vacant' | 'Partially';
    efficiencyScore: number; // 0-100
}

interface PropertyPerformanceTableProps {
    data: PropertyMetric[];
    className?: string;
    currency?: string;
}

type SortField = 'name' | 'netYield' | 'expenseRatio' | 'maintenanceCost' | 'efficiencyScore';
type SortOrder = 'asc' | 'desc';

export function PropertyPerformanceTable({ data, className, currency = 'KES' }: PropertyPerformanceTableProps) {
    const [sortField, setSortField] = useState<SortField>('efficiencyScore');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc'); // Default to desc for metrics usually
        }
    };

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }

            // Numbers
            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortField, sortOrder]);

    const formatMoney = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency, compactDisplay: "short", notation: "compact" }).format(val);
    const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>Asset Performance Rank</CardTitle>
                <CardDescription>Comparative analysis of portfolio assets.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">
                                <Button variant="ghost" onClick={() => handleSort('name')} className="p-0 hover:bg-transparent font-bold">
                                    Property <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('efficiencyScore')} className="p-0 hover:bg-transparent font-bold">
                                    Efficiency <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('netYield')} className="p-0 hover:bg-transparent font-bold">
                                    Net Yield <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('expenseRatio')} className="p-0 hover:bg-transparent font-bold">
                                    Exp. Ratio <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('maintenanceCost')} className="p-0 hover:bg-transparent font-bold">
                                    Maint. Cost <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full", item.efficiencyScore > 80 ? "bg-green-500" : item.efficiencyScore > 50 ? "bg-yellow-500" : "bg-red-500")}
                                                style={{ width: `${item.efficiencyScore}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground w-6">{item.efficiencyScore}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono">{item.netYield.toFixed(2)}%</TableCell>
                                <TableCell className="text-right font-mono">{formatPercent(item.expenseRatio)}</TableCell>
                                <TableCell className="text-right font-mono">{formatMoney(item.maintenanceCost)}</TableCell>
                                <TableCell className="text-center">
                                    {item.occupancyStatus === 'Occupied' ? (
                                        <div className="flex items-center justify-center text-green-600">
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            <span className="hidden sm:inline">Occupied</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center text-red-500">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            <span className="hidden sm:inline">Vacant</span>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
