'use client';

import { logEvent, isSupported, Analytics } from 'firebase/analytics';

/**
 * Logs a custom event to Firebase Analytics.
 * @param analytics The Firebase Analytics instance.
 * @param eventName The name of the event to log.
 * @param eventParams Optional parameters to associate with the event.
 */
export const logCustomEvent = async (analytics: Analytics, eventName: string, eventParams?: { [key: string]: any }) => {
  if (await isSupported()) {
    logEvent(analytics, eventName, eventParams);
  }
};
