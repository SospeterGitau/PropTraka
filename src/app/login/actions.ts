
'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

// This server action's only purpose is to create a session cookie.
// The actual authentication (login/signup) happens on the client.
export async function createSession() {
  const session = await getSession();
  
  // The onAuthStateChanged listener in the layout is now the source of truth for the user's state.
  // When it detects a user, it will allow access to the dashboard.
  // This redirect ensures that after the login/signup action completes,
  // we navigate to the dashboard, where the auth state listener will take over.
  
  session.isLoggedIn = true; 
  await session.save();

  redirect('/');
}

