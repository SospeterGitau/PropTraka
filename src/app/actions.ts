'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

// This server action's only purpose is to create a session cookie.
// The actual authentication (login/signup) happens on the client.
export async function createSession(shouldRedirect: boolean = true) {
  const session = await getSession();

  // The onAuthStateChanged listener in the layout is now the source of truth for the user's state.
  // When it detects a user, it will allow access to the dashboard.
  // This redirect ensures that after the login/signup action completes,
  // we navigate to the dashboard, where the auth state listener will take over.

  session.isLoggedIn = true;
  await session.save();

  if (shouldRedirect) {
    redirect('/');
  }
}

export async function logout() {
  const session = await getSession();
  await session.destroy();
  redirect('/signin');
}

// Allow base URL override via env var, otherwise default to production
const FUNCTIONS_BASE_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://us-central1-studio-4661291525-66fea.cloudfunctions.net';

export async function fetchMLPrediction(functionName: string, data: any) {
  try {
    const url = `${FUNCTIONS_BASE_URL}/${functionName}`;
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      // Try to parse JSON error if possible
      let errorMessage = response.statusText;
      try {
        const jsonError = JSON.parse(errorText);
        errorMessage = jsonError.error?.message || jsonError.message || errorMessage;
      } catch (e) {
        // Use raw text if not JSON
        if (errorText.length < 200) errorMessage = errorText;
      }

      throw new Error(`Function call failed: ${response.status} ${errorMessage} at ${url}`);
    }

    const json = await response.json();

    // Cloud Functions onCall protocol wraps response in { result: ... }
    // But direct HTTP triggers might not. We return the whole JSON or result if present.
    return json.result || json;

  } catch (err) {
    console.error(`Error in server action fetchMLPrediction (${functionName}):`, err);
    throw err;
  }
}
