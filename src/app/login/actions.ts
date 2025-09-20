
'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { APP_USER_EMAIL, APP_PASSWORD } from '@/lib/config';

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
) {
  try {
    const rawEmail = formData.get('email');
    const rawPassword = formData.get('password');

    if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
      return 'Email and password are required.';
    }

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword;

    const expectedEmail = APP_USER_EMAIL.trim().toLowerCase();

    if (email !== expectedEmail || password !== APP_PASSWORD) {
      return 'Invalid email or password.';
    }

    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();

  } catch (error) {
    console.error(error);
    return 'An unexpected error occurred.';
  }
  
  redirect('/');
}

export async function logout() {
  const session = await getSession();
  await session.destroy();
  redirect('/login');
}
