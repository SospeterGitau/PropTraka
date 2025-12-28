'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth';
import { generateBusinessPlan } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Download, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PageHeader } from '@/components/page-header';

export default function BusinessPlanPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const [context, setContext] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState<string | null>(null);

    // Protected Route Check
    useEffect(() => {
        if (!loading) {
            if (!user || user.email !== 'sospeter.gitau@gmail.com') {
                router.push('/dashboard');
            }
        }
    }, [user, loading, router]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateBusinessPlan({ additionalContext: context });
            if (result.plan) {
                setPlan(result.plan);
            } else {
                alert('Failed to generate plan.');
            }
        } catch (e) {
            console.error(e);
            alert('Error generating plan.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!plan) return;
        const blob = new Blob([plan], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'PropTraka_Business_Plan.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    // Double check render protection (though useEffect handles redirect)
    if (user.email !== 'sospeter.gitau@gmail.com') return null;

    return (
        <div className="container mx-auto max-w-4xl py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Business Plan Generator</h1>
                    <p className="text-muted-foreground text-sm">Restricted Access: {user.email}</p>
                </div>
            </div>

            {!plan ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Generate New Plan</CardTitle>
                        <CardDescription>Enter any specific context or focus areas for the AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="E.g., Focus specifically on the Nairobi market and integration with M-Pesa..."
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            className="min-h-[150px]"
                        />
                        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Comprehensive Plan...
                                </>
                            ) : (
                                'Generate Business Plan'
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card className="border-primary/20">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Generated Business Plan</CardTitle>
                                <CardDescription>AI-generated strategy for PropTraka.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPlan(null)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Start Over
                                </Button>
                                <Button size="sm" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download .md
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="prose prose-sm dark:prose-invert max-w-none p-8">
                            <ReactMarkdown>{plan}</ReactMarkdown>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
