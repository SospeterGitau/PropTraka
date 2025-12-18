'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useState } from 'react';

export function TrialBanner() {
    const { isTrial, daysRemaining } = useSubscription();
    const [isVisible, setIsVisible] = useState(true);

    if (!isTrial || !isVisible || daysRemaining <= 0) return null;

    return (
        <div className="bg-indigo-600 text-white px-4 py-3 relative">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                <p className="font-medium text-center sm:text-left">
                    Your 14-day free trial ends in <strong>{daysRemaining} days</strong>.
                    Upgrade now to keep your data and access professional features.
                </p>
                <div className="flex items-center gap-4">
                    <Button variant="secondary" size="sm" asChild className="whitespace-nowrap">
                        <Link href="/settings?tab=subscription">
                            Upgrade Now
                        </Link>
                    </Button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-indigo-700 rounded transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
