'use server';

import { redirect } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

// This is a server action, but it will operate on the client's auth state
// by communicating with the Firebase backend. A full implementation would
// likely use a client-side call, but this demonstrates the concept.
export async function logout() {
  // Server-side logout isn't directly possible with client-side SDK.
  // The correct implementation is to call signOut on the client.
  // This is a placeholder for what should be a client-side action.
  // In the real app, the button in the UI will call `auth.signOut()`.
  redirect('/login?action=logout');
}
