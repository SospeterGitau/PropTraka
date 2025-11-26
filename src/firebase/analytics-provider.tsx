'use client';

import { type ReactNode } from 'react';

/**
 * This component is responsible for logging page_view events to Firebase Analytics.
 * It should be placed in a layout component that wraps all pages you want to track.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
    // Analytics temporarily disabled
    return <>{children}</>;
}
