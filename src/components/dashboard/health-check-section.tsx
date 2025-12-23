'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    RefreshCw,
    TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Property } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip
} from 'recharts';

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
    onGenerateInsights?: () => void;
}

export function HealthCheckSection({ occupancyRate, totalArrears, properties, arrearsCount, aiInsights, loadingInsights, onGenerateInsights }: HealthCheckProps) {

    // --- Calculations ---

    // Diversity Score (0-10)
    const diversityScore = useMemo(() => {
        if (properties.length === 0) return 0;
        const types = new Set(properties.map(p => p.type).filter(Boolean));
        const locations = new Set(properties.map(p => p.address?.city).filter(Boolean));
        let score = 0;
        score += Math.min(types.size, 3) * 1.5;
        score += Math.min(locations.size, 3) * 1.5;
        if (properties.length > 4) score += 1;
        return Math.min(Math.round(score), 10);
    }, [properties]);

    // Overall Health Score (0-100)
    const healthScore = useMemo(() => {
        // Weights: Occupancy 50%, Arrears 25%, Diversity 25%
        const occupancyScore = occupancyRate; // 0-100

        let arrearsScore = 100;
        if (arrearsCount > 0) {
            // Penalize 20 points per property in arrears, min 0
            arrearsScore = Math.max(0, 100 - (arrearsCount * 20));
        }

        const divScore = diversityScore * 10; // Scale 0-10 to 0-100

        return Math.round((occupancyScore * 0.5) + (arrearsScore * 0.25) + (divScore * 0.25));
    }, [occupancyRate, arrearsCount, diversityScore]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#16a34a'; // green-600
        if (score >= 60) return '#ca8a04'; // yellow-600
        return '#dc2626'; // red-600
    };

    const healthData = [{
        name: 'Health',
        value: healthScore,
        fill: getScoreColor(healthScore)
    }];

    // Occupancy Data for Pie
    const occupancyData = [
        { name: 'Occupied', value: occupancyRate, color: '#16a34a' },
        { name: 'Vacant', value: 100 - occupancyRate, color: '#e5e7eb' }, // gray-200
    ];

    // --- Render ---

    return (
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-card via-card to-secondary/10 dark:from-secondary/5 dark:to-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
                <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <ShieldCheck className={cn("w-6 h-6", getScoreColor(healthScore) === '#16a34a' ? "text-green-600" : "text-yellow-600")} />
                        Portfolio Health
                    </CardTitle>
                    <CardDescription>
                        Real-time AI diagnostic & performance analysis
                    </CardDescription>
                </div>

                {onGenerateInsights && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onGenerateInsights}
                        disabled={loadingInsights || !!aiInsights}
                        className={cn("h-8 w-8 transition-all", loadingInsights && "animate-spin")}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                )}
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* LEFT: Health Score Gauge */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center relative min-h-[200px]">
                        <div className="w-[200px] h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    innerRadius="70%"
                                    outerRadius="100%"
                                    barSize={20}
                                    data={healthData}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <PolarAngleAxis
                                        type="number"
                                        domain={[0, 100]}
                                        angleAxisId={0}
                                        tick={false}
                                    />
                                    <RadialBar
                                        background
                                        dataKey="value"
                                        cornerRadius={10}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Centered Score Text */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-4 text-center">
                            <span className={cn("text-5xl font-bold tracking-tighter",
                                healthScore >= 80 ? "text-green-600" : healthScore >= 60 ? "text-yellow-600" : "text-red-600"
                            )}>
                                {healthScore}
                            </span>
                            <span className="text-sm text-muted-foreground block font-medium uppercase tracking-wide">
                                Score
                            </span>
                        </div>
                        <p className="text-sm text-center text-muted-foreground mt-[-20px] px-4">
                            {aiInsights?.overallAssessment || (
                                healthScore >= 80 ? "Your portfolio is performing consistently well."
                                    : healthScore >= 60 ? "Performance is stable but has room for improvement."
                                        : "Immediate attention required to improve performance."
                            )}
                        </p>
                    </div>

                    {/* RIGHT: Metrics Grid */}
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">

                        {/* Metric 1: Occupancy Pie */}
                        <div className="flex items-center gap-4 bg-background/50 rounded-xl p-4 border border-border/50">
                            <div className="h-16 w-16 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={occupancyData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={20}
                                            outerRadius={30}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {occupancyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-foreground">{occupancyRate}%</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-foreground">{occupancyRate}%</span>
                                    {occupancyRate < 90 && <Badge variant="outline" className="text-orange-600 text-[10px] px-1 py-0 border-orange-200 bg-orange-50">Low</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">Target: 95%+</p>
                            </div>
                        </div>

                        {/* Metric 2: Arrears */}
                        <div className="flex items-center gap-4 bg-background/50 rounded-xl p-4 border border-border/50">
                            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Arrears Risk</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-foreground">{formatCurrency(totalArrears, "en-KE", "KES")}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {arrearsCount} tenants overdue
                                </p>
                            </div>
                        </div>

                        {/* Analysis / Critical Actions */}
                        <div className="sm:col-span-2 bg-background/50 rounded-xl p-4 border border-border/50 min-h-[100px]">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                AI Insights & Recommendations
                            </h4>

                            {loadingInsights ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-2 bg-muted rounded w-3/4"></div>
                                    <div className="h-2 bg-muted rounded w-1/2"></div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {aiInsights?.criticalActions.length ? (
                                        aiInsights.criticalActions.slice(0, 2).map((action, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm">
                                                <Badge variant="destructive" className="mt-0.5 px-1 py-0 text-[10px] uppercase">Action</Badge>
                                                <span className="text-muted-foreground">{action}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>No critical issues. Keep up the good work!</span>
                                        </div>
                                    )}

                                    {!aiInsights && !loadingInsights && (
                                        <p className="text-sm text-muted-foreground">
                                            Click the refresh icon to let AI analyze your portfolio's latest data.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Fallback for missing types if needed
export default HealthCheckSection;
