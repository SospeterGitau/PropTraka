'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
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
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-destructive/5 rounded-full blur-3xl -z-10" />

            <Card glass className="w-full max-w-md text-center border-none shadow-2xl">
                <CardHeader className="pb-2">
                    <div className="mx-auto bg-destructive/10 rounded-full p-4 mb-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Something went wrong!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        We encountered an unexpected error. Our team has been notified.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="bg-muted p-2 rounded text-xs font-mono text-left overflow-auto max-h-32 mb-4">
                            {error.message}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 sm:flex-row justify-center">
                    <Button onClick={reset} variant="default">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Return Home
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
