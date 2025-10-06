
import { cookies } from 'next/headers';
import type { IronSessionOptions, IronSession } from 'iron-session';
import { getIronSession } from 'iron-session';
import { SESSION_PASSWORD } from '@/lib/config';

export interface SessionData {
  isLoggedIn: boolean;
}

export const sessionOptions: IronSessionOptions = {
  cookieName: 'rentvision_session',
  password: SESSION_PASSWORD,
  cookieOptions: {
    // Set secure to true in production, which is required for SameSite=None
    secure: process.env.NODE_ENV === 'production',
    // SameSite=None allows the cookie to be sent in cross-site requests (e.g., from an iframe)
    sameSite: 'lax',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}
