
'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { logEvent, isSupported } from 'firebase/analytics';
import { useAnalytics } from '@/firebase/provider';

/**
 * This component is responsible for logging page_view events to Firebase Analytics.
 * It should be placed in a layout component that wraps all pages you want to track.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const analytics = useAnalytics();

    useEffect(() => {
        const logPageView = async () => {
            if (analytics && await isSupported()) {
                logEvent(analytics, 'page_view', {
                    page_path: pathname,
                    page_location: window.location.href,
                    page_title: document.title,
                });
            }
        };

        logPageView();

    }, [pathname, analytics]);

    return <>{children}</>;
}
