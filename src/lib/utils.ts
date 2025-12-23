
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A centralized utility for formatting currency consistently across the app.
 * Ensures that all monetary values are displayed with two decimal places.
 * @param amount The numerical value to format.
 * @param locale The locale string (e.g., 'en-GB', 'en-US').
 * @param currency The currency code (e.g., 'KES', 'USD').
 * @returns A formatted currency string (e.g., "KES 1,234.56").
 */
export function formatCurrency(amount: number, locale: string = 'en-KE', currency: string = 'KES'): string {
  if (currency === 'KES') {
    return `KSh ${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse a mixed date value (Firestore Timestamp, Date, number, or ISO string)
 * into a JS Date object or undefined when the value is not parseable.
 */
export function parseDate(value: any): Date | undefined {
  if (!value && value !== 0) return undefined;
  // Firestore Timestamp
  if (typeof value === 'object' && typeof (value as any).toDate === 'function') {
    try { return (value as any).toDate(); } catch { /* fallthrough */ }
  }
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}
