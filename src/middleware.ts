import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n-config';

export default createMiddleware({
    // A list of all locales that are supported
    locales,

    // Used when no locale matches
    defaultLocale: 'en'
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(zh-yue|zh|fr|pt|de|it|am|ar|hi|es|ja|ur|en)/:path*']
};
