'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';
import type { GenerateSmartAlertsOutput } from '@/ai/flows/generate-smart-alerts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getSmartAlerts } from '@/lib/actions';

const severityIcons = {
  high: <AlertTriangle className="h-5 w-5 text-destructive" />,
  medium: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  low: <Lightbulb className="h-5 w-5 text-blue-500" />,
};

const severityClasses = {
  high: 'border-destructive/50 text-destructive',
  medium: 'border-yellow-500/50 text-yellow-600',
  low: 'border-blue-500/50 text-blue-600',
}

export function SmartAlerts() {
  const [isPending, startTransition] = useTransition();
  const [alerts, setAlerts] = useState<GenerateSmartAlertsOutput['alerts'] | null>(null);

  const handleGenerateAlerts = () => {
    startTransition(async () => {
      const result = await getSmartAlerts();
      setAlerts(result.alerts);
    });
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI-Powered Smart Alerts</CardTitle>
            <CardDescription>Proactive insights to mitigate risks and plan ahead.</CardDescription>
          </div>
          <Button onClick={handleGenerateAlerts} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4" />
            )}
            Generate Insights
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!alerts && (
            <div className="text-center text-muted-foreground py-8">
              <Lightbulb className="mx-auto h-12 w-12" />
              <p className="mt-4">Click "Generate Insights" to get AI-powered alerts about your properties.</p>
            </div>
          )}
          {isPending && !alerts && (
             <div className="text-center text-muted-foreground py-8">
                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                <p className="mt-4">Analyzing data and generating alerts...</p>
             </div>
          )}
          {alerts?.map((alert, index) => (
            <Alert key={index} className={severityClasses[alert.severity]}>
               {severityIcons[alert.severity]}
              <AlertTitle className="ml-8 capitalize">{alert.severity} Alert: {alert.propertyAddress}</AlertTitle>
              <AlertDescription className="ml-8">{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
