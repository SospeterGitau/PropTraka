
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
export function formatCurrency(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
