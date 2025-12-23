'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4">
            <Card glass className="w-full max-w-md text-center border-dashed">
                <CardContent className="pt-6 flex flex-col items-center">
                    <div className="bg-destructive/10 p-3 rounded-full mb-4">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-xl mb-2">Unable to load dashboard data</CardTitle>
                    <p className="text-muted-foreground mb-6 text-sm">
                        There was a problem fetching your latest data. This might be a temporary network issue.
                    </p>
                    <Button onClick={reset} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry connection
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
