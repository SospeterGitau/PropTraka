/**
 * Format currency values with proper locale and currency handling
 * Handles edge cases like KES which may not format correctly with Intl.NumberFormat
 */
export function formatCurrency(
  value: number | undefined | null,
  currency: string = 'KES',
  locale: string = 'en-KE'
): string {
  if (value === undefined || value === null) {
    return `${currency} 0`;
  }

  try {
    // First, try standard Intl.NumberFormat
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

    // If result contains unexpected symbols, use fallback
    if (formatted.includes('$') && currency !== 'USD') {
      return `${currency} ${new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)}`;
    }

    return formatted;
  } catch (e) {
    // Fallback: manual formatting with locale-aware thousands separator
    const numberFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const formattedNumber = numberFormatter.format(value);
    return `${currency} ${formattedNumber}`;
  }
}

/**
 * Map locales to appropriate Intl locales for number formatting
 */
export function getIntlLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    'en-GB': 'en-GB', // British English
    'en-US': 'en-US', // American English
    'en-KE': 'en-GB', // Kenya - use British format (DD/MM)
  };
  return localeMap[locale] || 'en-GB';
}
