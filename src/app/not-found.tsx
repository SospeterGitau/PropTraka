'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Ghost, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />

            <Card glass className="w-full max-w-md text-center border-none shadow-2xl">
                <CardHeader className="space-y-2 pb-2">
                    <div className="mx-auto bg-muted rounded-full p-4 mb-4">
                        <Ghost className="h-12 w-12 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-primary">404</h1>
                    <CardTitle className="text-xl">Page Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Oops! The room you are looking for seems to have been demolished... or maybe it never existed.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 sm:flex-row justify-center pt-2">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                    <Button asChild>
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
