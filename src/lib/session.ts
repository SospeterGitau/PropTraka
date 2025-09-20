
import type { IronSessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn: boolean;
}

export const sessionOptions: IronSessionOptions = {
  cookieName: 'rentvision_session',
  password: process.env.SESSION_PASSWORD || 'complex_password_for_session_encryption_at_least_32_characters_long',
  cookieOptions: {
    // Set secure to true to allow cross-site cookies.
    secure: true,
    // SameSite=None is required for cross-site cookie handling (e.g., in iframes).
    sameSite: 'none',
  },
};
