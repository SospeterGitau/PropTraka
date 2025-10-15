import { cookies } from 'next/headers';
import type { IronSessionOptions, IronSession } from 'iron-session';
import { getIronSession } from 'iron-session';

// This session is no longer used for primary authentication, which is now
// handled by Firebase client-side. However, it can still be useful for
// storing other session-related data on the server if needed.

export interface SessionData {
  isLoggedIn: boolean; // This is now a secondary indicator, not the source of truth.
}

export const sessionOptions: IronSessionOptions = {
  cookieName: 'rentvision_session',
  password: process.env.SESSION_PASSWORD || 'complex_password_at_least_32_characters_long',
  cookieOptions: {
    // Set secure to true in production, which is required for SameSite=None
    secure: process.env.NODE_ENV === 'production',
    // sameSite: 'none',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}
