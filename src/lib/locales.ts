
import type { Locale } from 'date-fns';

export async function getLocale(locale: string): Promise<Locale> {
  switch (locale) {
    case 'en-GB':
      return (await import('date-fns/locale/en-GB')).default;
    case 'de-DE':
      return (await import('date-fns/locale/de')).default;
    case 'fr-FR':
      return (await import('date-fns/locale/fr')).default;
    case 'ja-JP':
        return (await import('date-fns/locale/ja')).default;
    case 'en-US':
    default:
      return (await import('date-fns/locale/en-US')).default;
  }
}
