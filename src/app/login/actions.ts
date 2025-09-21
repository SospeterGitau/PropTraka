
'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { APP_PASSWORD } from '@/lib/config';

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
) {
  try {
    const rawPassword = formData.get('password');

    if (typeof rawPassword !== 'string') {
      return 'Password is required.';
    }

    const password = rawPassword;

    if (password !== APP_PASSWORD) {
      return 'Invalid password.';
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
