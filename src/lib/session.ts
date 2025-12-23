
import { cookies } from 'next/headers';
import type { SessionOptions, IronSession } from 'iron-session';
import { getIronSession } from 'iron-session';

// Ensure SESSION_PASSWORD is set in your environment variables
// For local development we provide a safe default to avoid accidental crashes
// but we still warn loudly so developers know to set a secure value.
let sessionPassword = process.env.SESSION_PASSWORD;
if (!sessionPassword) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variable: SESSION_PASSWORD');
  } else {
    // Development convenience default. CHANGE THIS for any shared/dev environments.
    sessionPassword = 'dev-session-password-please-change';
    // eslint-disable-next-line no-console
    console.warn(
      "WARNING: SESSION_PASSWORD is not set. Using a development default session password. " +
      "Set SESSION_PASSWORD in your environment or create a .env.local with a secure value to avoid using this default."
    );
  }
}

export interface SessionData {
  isLoggedIn: boolean;
  uid?: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: 'proptraka_session',
  password: sessionPassword,
  cookieOptions: {
    // Set secure to true, which is required for SameSite=None
    secure: process.env.NODE_ENV === 'production',
    // SameSite=None allows the cookie to be sent in cross-site requests
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
