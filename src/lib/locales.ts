
import type { Locale } from 'date-fns';

export async function getLocale(locale: string): Promise<Locale> {
  switch (locale) {
    case 'en-GB':
      return (await import('date-fns/locale/en-GB')).enGB;
    case 'de-DE':
      return (await import('date-fns/locale/de')).de;
    case 'fr-FR':
      return (await import('date-fns/locale/fr')).fr;
    case 'ja-JP':
        return (await import('date-fns/locale/ja')).ja;
    case 'en-US':
    default:
      return (await import('date-fns/locale/en-US')).enUS;
  }
}
