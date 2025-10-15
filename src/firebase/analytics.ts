'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logEvent, isSupported } from 'firebase/analytics';
import { useAnalytics } from '@/firebase/provider';

// Log a page view event
export const logPageView = async () => {
    if (await isSupported()) {
        const analytics = useAnalytics();
        if (analytics) {
            logEvent(analytics, 'page_view', {
                page_path: window.location.pathname,
                page_location: window.location.href,
                page_title: document.title,
            });
        }
    }
};

// Log a custom event
export const logCustomEvent = async (eventName: string, eventParams: object) => {
    if (await isSupported()) {
        const analytics = useAnalytics();
        if (analytics) {
            logEvent(analytics, eventName, eventParams);
        }
    }
};
