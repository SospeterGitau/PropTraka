'use client';

import React, { useState } from 'react';
import { useUser } from '@/firebase/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Building, TrendingDown, AlertCircle, Percent, TrendingUp, Calendar, CurrencyIcon
} from 'lucide-react';
import type { Property, RevenueTransaction, Expense, Tenancy } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { HealthCheckSection } from '@/components/dashboard/health-check-section';
import { MLPredictionsPanel } from '@/components/dashboard/ml-predictions-panel';
import { generateHealthInsights } from '@/ai/flows/generate-health-insights';

interface DashboardMetrics {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    totalArrears: number;
    totalPropertyValue: number;
    portfolioNetWorth: number;
    occupancyRate: number;
    avgRentPerTenancy: number;
    totalProperties: number;
    activeTenanciesCount: number;
    thisMonthRevenue: number;
    arrearsCount: number;
}

interface DashboardClientProps {
    metrics: DashboardMetrics;
    properties: Property[];
}

export function DashboardClient({ metrics, properties }: DashboardClientProps) {
    const { user } = useUser();
    const [aiInsights, setAiInsights] = useState<any>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);

    // Health Insights Logic
    const handleGenerateInsights = async () => {
        if (!metrics || properties.length === 0) return;

        setLoadingInsights(true);

        const types = new Set(properties.map(p => p.type).filter(Boolean));
        const locations = new Set(properties.map(p => p.address?.city).filter(Boolean));
        let diversityScore = 0;
        diversityScore += Math.min(types.size, 3) * 1.5;
        diversityScore += Math.min(locations.size, 3) * 1.5;
        if (properties.length > 4) diversityScore += 1;
        diversityScore = Math.min(Math.round(diversityScore), 10);

        try {
            const result = await generateHealthInsights({
                occupancyRate: metrics.occupancyRate,
                totalArrears: metrics.totalArrears,
                arrearsCount: metrics.arrearsCount,
                diversityScore,
                propertyCount: metrics.totalProperties
            });
            setAiInsights(result);
        } catch (err) {
            console.error("Failed to generate AI insights:", err);
        } finally {
            setLoadingInsights(false);
        }
    };

    return (
        <>
            <PageHeader title={`Welcome back, ${user?.displayName || 'User'}!`} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <KpiCard
                    icon={Building}
                    title="Total Properties"
                    value={metrics.totalProperties}
                    description={`${metrics.totalProperties} unit(s) across portfolio`}
                    formatAs="integer"
                />

                <KpiCard
                    icon={Percent}
                    title="Occupancy Rate"
                    value={metrics.occupancyRate}
                    description={`${metrics.activeTenanciesCount} active tenanc(ies)`}
                    formatAs="percent"
                />

                <KpiCard
                    icon={TrendingDown}
                    title="Total Expenses"
                    value={metrics.totalExpenses}
                    description="Cumulative from all properties"
                    variant="destructive"
                />

                <KpiCard
                    icon={AlertCircle}
                    title="Overdue Payments"
                    value={metrics.totalArrears}
                    description="Total outstanding arrears"
                    variant="destructive"
                />

                <KpiCard
                    icon={Building}
                    title="Portfolio Asset Value"
                    value={metrics.totalPropertyValue}
                    description="Current combined market value"
                />

                <KpiCard
                    icon={CurrencyIcon}
                    title="Equity After Mortgages"
                    value={metrics.portfolioNetWorth}
                    description="Net ownership value"
                />

                <KpiCard
                    icon={TrendingUp}
                    title="Net Profit"
                    value={metrics.profit}
                    description="Revenue - Expenses"
                    variant={metrics.profit >= 0 ? 'positive' : 'destructive'}
                />

                <KpiCard
                    icon={Calendar}
                    title="Monthly Revenue (Current)"
                    value={metrics.thisMonthRevenue}
                    description={`${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
                />
            </div>


            <div className="mb-0">
                <HealthCheckSection
                    occupancyRate={metrics.occupancyRate}
                    totalArrears={metrics.totalArrears}
                    properties={properties}
                    arrearsCount={metrics.arrearsCount}
                    aiInsights={aiInsights}
                    loadingInsights={loadingInsights}
                    onGenerateInsights={handleGenerateInsights}
                />
            </div>

            <div className="mb-8">
                <MLPredictionsPanel properties={properties} />
            </div>
        </>
    );
}
