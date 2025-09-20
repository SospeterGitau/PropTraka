'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { IronSession, getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { APP_USER_EMAIL, APP_PASSWORD } from '@/lib/config';


export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}


export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const email = formData.get('email');
    const password = formData.get('password');

    if (email !== APP_USER_EMAIL) {
      return 'Invalid email address.';
    }

    if (password !== APP_PASSWORD) {
      return 'Invalid password.';
    }

    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('CredentialsSignin')) {
      return 'Invalid credentials.';
    }
    console.error(error);
    return 'An unexpected error occurred.';
  }

  redirect('/');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
