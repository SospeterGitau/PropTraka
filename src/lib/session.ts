
import type { IronSessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn: boolean;
}

export const sessionOptions: IronSessionOptions = {
  cookieName: 'rentvision_session',
  password: process.env.SESSION_PASSWORD || 'complex_password_for_session_encryption_at_least_32_characters_long',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
