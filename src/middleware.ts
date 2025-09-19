
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/app/login/actions';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};

export async function middleware(request: NextRequest) {
  const isLoggedIn = await verifySession();

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
