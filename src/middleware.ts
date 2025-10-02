
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    // Avoid redirecting for static assets and API routes
    if (
      !request.nextUrl.pathname.startsWith('/_next') &&
      !request.nextUrl.pathname.startsWith('/api') &&
      request.nextUrl.pathname !== '/favicon.ico'
    ) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page itself)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
}
