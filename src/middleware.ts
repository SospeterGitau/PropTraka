import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n-config';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions, SessionData } from './lib/session';
import { getIronSession } from 'iron-session';

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales,

    // Used when no locale matches
    defaultLocale: 'en'
});

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define protected routes (simple prefix match)
    // Adjust these as needed for your app structure
    const protectedPaths = [
        '/dashboard',
        '/properties',
        '/tenants',
        '/reports',
        '/settings'
    ];

    // Check if the current path (ignoring locale for now) is protected.
    // We need to be careful with locale prefixes (e.g. /en/dashboard)
    const isProtected = protectedPaths.some(path => {
        // Match exact path or subpaths, considering optional locale prefix
        // Regex: ^(/locale)?/path(/.*)?$
        const regex = new RegExp(`^(/(${locales.join('|')}))?${path}(/.*)?$`);
        return regex.test(pathname);
    });

    if (isProtected) {
        // 2. Check for session
        const response = NextResponse.next();
        const session = await getIronSession<SessionData>(request, response, sessionOptions);

        if (!session || !session.isLoggedIn) {
            // Redirect to signin
            // Determine locale to redirect properly
            let locale = 'en';
            const localeMatch = pathname.match(new RegExp(`^/(${locales.join('|')})`));
            if (localeMatch) {
                locale = localeMatch[1];
            }

            return NextResponse.redirect(new URL(`/${locale}/signin`, request.url));
        }
    }

    // 3. Continue with intl middleware
    return intlMiddleware(request);
}

export const config = {
    // Match only internationalized pathnames
    matcher: ['/((?!api|_next|.*\\..*).*)']
};
