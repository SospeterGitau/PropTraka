
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { IronSession, getIronSession } from 'iron-session';

const sessionOptions = {
  cookieName: 'rentvision_session',
  password: process.env.SESSION_PASSWORD || 'complex_password_for_session_encryption_at_least_32_characters_long',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

async function getSession(): Promise<IronSession<{ isLoggedIn?: boolean }>> {
  const session = await getIronSession<{ isLoggedIn?: boolean }>(cookies(), sessionOptions);
  return session;
}


export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const password = formData.get('password');

    if (password !== process.env.APP_PASSWORD) {
      return 'Invalid password.';
    }

    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();
    
  } catch (error) {
    if ((error as Error).message.includes('CredentialsSignin')) {
      return 'Invalid credentials.';
    }
    return 'An error occurred.';
  }

  redirect('/');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}

export async function verifySession() {
  const session = await getSession();
  return session.isLoggedIn === true;
}
