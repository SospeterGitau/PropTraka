
'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getAuth } from 'firebase/auth'; // Using client SDK on server for session purposes
import { initializeFirebase } from '@/firebase'; // This should be safe now

// This server action's only purpose is to create a session cookie.
// The actual authentication (login/signup) happens on the client.
export async function login() {
  const session = await getSession();

  // Since this action is called *after* client-side login is successful,
  // we can't easily get the user's UID here without another round trip.
  // The onAuthStateChanged listener in the layout is now the source of truth for the user's state.
  // When it detects a user, it will allow access to the dashboard.
  // This redirect ensures that after the login/signup action completes,
  // we navigate to the dashboard, where the auth state listener will take over.
  
  // We can set a simple flag in the session if needed, but it's not the primary auth check.
  session.isLoggedIn = true; 
  await session.save();

  redirect('/dashboard');
}
