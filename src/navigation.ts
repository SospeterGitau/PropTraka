import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales, localePrefix } from './i18n-config';

export { locales, localePrefix };

export const { Link, redirect, usePathname, useRouter } =
    createSharedPathnamesNavigation({ locales, localePrefix });
