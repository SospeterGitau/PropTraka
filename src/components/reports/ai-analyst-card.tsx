'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { generateReportSummary } from '@/ai/flows/generate-report-summary';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AiAnalystCardProps {
    contextData: string; // Serialized context
    contextName: string; // e.g. "Cash Flow Analysis"
    className?: string;
    autoRun?: boolean;
}

export function AiAnalystCard({ contextData, contextName, className, autoRun = false }: AiAnalystCardProps) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            // We pass the context data to the prompt as "summary" effectively
            // Ideally the prompt should be "Analyze this data: ..."
            // The current `generateReportSummary` server action takes `{ summary: string }` and passes it to the prompt.
            // So we format our input string to be descriptive.

            const promptInput = `
        Analyze the following data for the section "${contextName}":
        ${contextData}
        
        Provide a concise, forensic analysis identifying key anomalies, trends, or actionable insights. 
        Focus on "Why" something happened if the data suggests it.
      `;

            const result = await generateReportSummary({ summary: promptInput });
            if (result.summary) {
                setAnalysis(result.summary);
            } else {
                throw new Error('No analysis generated');
            }
        } catch (err: any) {
            console.error("AI Analysis failed:", err);
            setError("Unable to generate analysis at this time.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoRun && !analysis) {
            runAnalysis();
        }
    }, [autoRun]);

    return (
        <Card className={cn("w-full bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                        <Sparkles className="w-5 h-5" />
                        AI Forensic Analyst
                    </CardTitle>
                    <CardDescription>
                        Automated insights for {contextName}
                    </CardDescription>
                </div>
                {!loading && (
                    <Button variant="ghost" size="icon" onClick={runAnalysis} title="Regenerate Analysis">
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-[90%]" />
                        <Skeleton className="h-4 w-[80%]" />
                    </div>
                ) : error ? (
                    <div className="text-sm text-red-500">{error}</div>
                ) : analysis ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                        {/* Simple markdown rendering or just text */}
                        <p className="whitespace-pre-line">{analysis}</p>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Button onClick={runAnalysis} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/50">
                            Generate Analysis
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
