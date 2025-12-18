'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    TrendingUp,
    ShieldCheck,
    PieChart,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Property } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HealthCheckProps {
    occupancyRate: number;
    totalArrears: number;
    properties: Property[];
    arrearsCount: number;
    aiInsights?: {
        criticalActions: string[];
        positiveHighlights: string[];
        overallAssessment: string;
    } | null;
    loadingInsights?: boolean;
}

export function HealthCheckSection({ occupancyRate, totalArrears, properties, arrearsCount, aiInsights, loadingInsights }: HealthCheckProps) {

    // Calculate Diversity Score based on property types and locations
    const diversityScore = useMemo(() => {
        if (properties.length === 0) return 0;

        const types = new Set(properties.map(p => p.type).filter(Boolean));
        const locations = new Set(properties.map(p => p.address?.city).filter(Boolean));

        // Simple algorithm: 
        // Types count (max 3) * 1.5 + Locations count (max 3) * 1.5 + (Properties > 5 ? 1 : 0)
        // Scaled to 0-10

        let score = 0;
        score += Math.min(types.size, 3) * 1.5;
        score += Math.min(locations.size, 3) * 1.5;
        if (properties.length > 4) score += 1;

        // Cap at 10
        return Math.min(Math.round(score), 10);
    }, [properties]);

    // Determine Critical Actions
    const criticalActions = [];
    if (occupancyRate < 85) {
        criticalActions.push({
            id: 'occupancy',
            title: 'Low Occupancy Rate',
            message: `Occupancy is at ${occupancyRate.toFixed(0)}%. Consider marketing vacant units.`,
            severity: 'high',
            link: '/properties'
        });
    }
    if (arrearsCount > 0) {
        criticalActions.push({
            id: 'arrears',
            title: 'Unresolved Arrears',
            message: `${arrearsCount} tenant(s) in arrears totalling ${formatCurrency(totalArrears, "en-KE", "KES")}.`,
            severity: arrearsCount > 2 ? 'high' : 'medium',
            link: '/arrears'
        });
    }
    if (properties.length > 0 && properties.some(p => !p.insuranceExpiry)) {
        criticalActions.push({
            id: 'insurance',
            title: 'Missing Insurance Data',
            message: 'Some properties have no insurance expiry date recorded.',
            severity: 'low',
            link: '/properties'
        });
    }

    // Determine "What is Good"
    const goodPoints = [];
    if (occupancyRate >= 95) goodPoints.push('Excellent occupancy rate above 95%');
    if (diversityScore >= 7) goodPoints.push('Well-diversified portfolio reducing risk');
    if (totalArrears === 0 && properties.length > 0) goodPoints.push('Zero arrears across all properties');
    if (properties.length >= 3) goodPoints.push('Growing portfolio size');

    const getDiversityColor = (score: number) => {
        if (score >= 7) return 'text-green-600';
        if (score >= 4) return 'text-blue-600';
        return 'text-orange-600';
    };

    const getOccupancyColor = (rate: number) => {
        if (rate >= 90) return 'text-green-600';
        if (rate >= 75) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-6 mb-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Portfolio Health Check
                </h2>
                <p className="text-sm text-muted-foreground">
                    {aiInsights?.overallAssessment || "Real-time diagnostic of your portfolio's performance and risk factors."}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Occupancy Card */}
                <Card className="md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between mb-2">
                            <span className={cn("text-3xl font-bold", getOccupancyColor(occupancyRate))}>
                                {occupancyRate.toFixed(0)}%
                            </span>
                            <span className="text-sm text-muted-foreground mb-1">Target: 95%</span>
                        </div>
                        <Progress value={occupancyRate} className={cn("h-2", occupancyRate < 75 ? "bg-red-100 dark:bg-red-900" : "bg-green-100 dark:bg-green-900")} />
                        <p className="text-xs text-muted-foreground mt-3">
                            {properties.length} total units
                        </p>
                    </CardContent>
                </Card>

                {/* Diversity Score Card */}
                <Card className="md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Diversity Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between mb-2">
                            <span className={cn("text-3xl font-bold", getDiversityColor(diversityScore))}>
                                {diversityScore}/10
                            </span>
                            <PieChart className={cn("w-6 h-6 mb-1 opacity-50", getDiversityColor(diversityScore))} />
                        </div>
                        <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className={cn("h-1.5 flex-1 rounded-full", (i * 2) <= diversityScore ? "bg-current" : "bg-muted", getDiversityColor(diversityScore))} />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Based on property types & locations
                        </p>
                    </CardContent>
                </Card>

                {/* Arrears Health Card */}
                <Card className="md:col-span-1 border-l-4 border-l-transparent data-[status=bad]:border-l-red-500 data-[status=good]:border-l-green-500" data-status={arrearsCount > 0 ? 'bad' : 'good'}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Arrears Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {arrearsCount > 0 ? (
                            <>
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-3xl font-bold text-red-600">
                                        {arrearsCount}
                                    </span>
                                    <AlertCircle className="w-6 h-6 text-red-600 mb-1 opacity-50" />
                                </div>
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                    Total: {formatCurrency(totalArrears, "en-KE", "KES")}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-3xl font-bold text-green-600">
                                        Healthy
                                    </span>
                                    <CheckCircle2 className="w-6 h-6 text-green-600 mb-1 opacity-50" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">No outstanding payments</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Critical Actions */}
                <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-orange-800 dark:text-orange-300">
                            <AlertTriangle className="w-4 h-4" />
                            Critical Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {loadingInsights ? (
                            <div className="space-y-2 animate-pulse">
                                <div className="h-4 bg-orange-200 dark:bg-orange-800/50 rounded w-3/4"></div>
                                <div className="h-4 bg-orange-200 dark:bg-orange-800/50 rounded w-1/2"></div>
                            </div>
                        ) : aiInsights ? (
                            aiInsights.criticalActions.length > 0 ? (
                                <ul className="space-y-2">
                                    {aiInsights.criticalActions.map((action, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-orange-900 dark:text-orange-100 font-medium">
                                            <AlertTriangle className="w-4 h-4 min-w-[16px] text-orange-600 dark:text-orange-400 mt-0.5" />
                                            {action}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <p className="text-sm font-medium">No critical actions identified by AI.</p>
                                </div>
                            )
                        ) : (
                            // Fallback to static logic
                            criticalActions.length > 0 ? (
                                criticalActions.map((action) => (
                                    <div key={action.id} className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between bg-background/50 p-2 rounded-md">
                                        <div>
                                            <p className="text-sm font-medium">{action.title}</p>
                                            <p className="text-xs text-muted-foreground">{action.message}</p>
                                        </div>
                                        {action.link && (
                                            <Button asChild size="sm" variant="outline" className="h-7 text-xs sm:w-auto w-full">
                                                <Link href={action.link}>Review <ArrowRight className="w-3 h-3 ml-1" /></Link>
                                            </Button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <p className="text-sm font-medium">No critical actions needed right now.</p>
                                </div>
                            )
                        )}

                    </CardContent>
                </Card>

                {/* What is Good */}
                <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-green-800 dark:text-green-300">
                            <TrendingUp className="w-4 h-4" />
                            What's Going Well
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingInsights ? (
                            <div className="space-y-2 animate-pulse">
                                <div className="h-4 bg-green-200 dark:bg-green-800/50 rounded w-3/4"></div>
                                <div className="h-4 bg-green-200 dark:bg-green-800/50 rounded w-1/2"></div>
                            </div>
                        ) : aiInsights ? (
                            aiInsights.positiveHighlights.length > 0 ? (
                                <ul className="space-y-2">
                                    {aiInsights.positiveHighlights.map((point, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-green-900 dark:text-green-100 font-medium">
                                            <CheckCircle2 className="w-4 h-4 min-w-[16px] text-green-600 dark:text-green-400 mt-0.5" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">Keep improving your portfolio to see highlights here.</p>
                            )
                        ) : (
                            /* Fallback to static logic */
                            goodPoints.length > 0 ? (
                                <ul className="space-y-2">
                                    {goodPoints.map((point, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-green-900 dark:text-green-100 font-medium">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">Keep improving your portfolio to see highlights here.</p>
                            )
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
