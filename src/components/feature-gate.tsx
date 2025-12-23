'use client';

import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
    featureId: string;
    children: ReactNode;
    fallback?: ReactNode; // Optional custom fallback
}

export function FeatureGate({ featureId, children, fallback }: FeatureGateProps) {
    const { checkAccess, isTrial, daysRemaining } = useSubscription();
    const hasAccess = checkAccess(featureId);

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <Card className="border-dashed border-2 bg-muted/30">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-2">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">Feature Locked</CardTitle>
                <CardDescription>
                    Upgrade your plan to unlock this feature.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
                <Button asChild size="sm">
                    <Link href="/settings?tab=subscription">
                        View Upgrade Options
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
