
import { cookies } from 'next/headers';
import type { IronSessionOptions, IronSession } from 'iron-session';
import { getIronSession } from 'iron-session';

// Ensure SESSION_PASSWORD is set in your environment variables
const sessionPassword = process.env.SESSION_PASSWORD;
if (!sessionPassword) {
  throw new Error('Missing required environment variable: SESSION_PASSWORD');
}

export interface SessionData {
  isLoggedIn: boolean;
}

export const sessionOptions: IronSessionOptions = {
  cookieName: 'rentvision_session',
  password: sessionPassword,
  cookieOptions: {
    // Set secure to true, which is required for SameSite=None
    secure: process.env.NODE_ENV === 'production',
    // SameSite=None allows the cookie to be sent in cross-site requests
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}
