
'use client';

import { useState, useTransition } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getReportSummary } from '@/lib/actions';

interface ReportSummaryProps {
  data: any;
}

export function ReportSummary({ data }: ReportSummaryProps) {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);

  const handleGenerateSummary = () => {
    startTransition(async () => {
      const result = await getReportSummary(data);
      setSummary(result.summary);
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI-Powered Report Summary</CardTitle>
            <CardDescription>Get a quick, narrative overview of your financial performance.</CardDescription>
          </div>
          <Button onClick={handleGenerateSummary} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4" />
            )}
            Generate Summary
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-4">
          {isPending && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin" />
              <p className="mt-4">Analyzing your report...</p>
            </>
          )}
          {!isPending && !summary && (
            <>
              <Lightbulb className="mx-auto h-10 w-10" />
              <p className="mt-4">Click "Generate Summary" to get an AI-powered analysis of this report.</p>
            </>
          )}
          {summary && (
            <p className="text-foreground text-left whitespace-pre-wrap">{summary}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
