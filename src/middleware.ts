import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// This middleware is no longer the primary guard for auth.
// Firebase auth state is checked on the client.
// This middleware is simplified to not interfere with the build process.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
