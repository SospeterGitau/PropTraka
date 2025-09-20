
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { IronSession, getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';


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

    if (email !== process.env.APP_USER_EMAIL) {
      return 'Invalid email address.';
    }

    if (password !== process.env.APP_PASSWORD) {
      return 'Invalid password.';
    }

    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('CredentialsSignin')) {
      return 'Invalid credentials.';
    }
    return 'An error occurred.';
  }

  revalidatePath('/');
  redirect('/');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
