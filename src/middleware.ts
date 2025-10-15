import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';

// This middleware is no longer the primary guard for auth.
// Firebase auth state is checked on the client.
// This middleware can be used for other purposes or removed if not needed.
// For now, it simply passes all requests through.

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The new authentication model is based on Firebase client-side auth state.
  // The pages will redirect to '/login' if the user is not authenticated.
  // The login page itself will redirect to '/' if the user is already authenticated.
  // This middleware is simplified to not interfere with that flow.

  // Allow all API routes, static files, and the login page to pass through
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') || // for static files like favicon.ico
    pathname === '/login'
  ) {
    return NextResponse.next();
  }
  
  // For other pages, we can just let them render.
  // Client-side components will handle auth checks.
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
