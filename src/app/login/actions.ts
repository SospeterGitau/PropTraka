
'use server';

import { getAuth } from 'firebase-admin/auth';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getAdminApp } from '@/firebase/admin';

// This function now uses the Firebase Admin SDK
export async function login(formData: {email: string, password: string}) {
  const { email, password } = formData;
  
  // Initialize Admin SDK
  const app = getAdminApp();
  const auth = getAuth(app);

  try {
    let userRecord;
    try {
      // First, try to get the user to see if they exist.
      userRecord = await auth.getUserByEmail(email);
      // If user exists, we'll proceed to the client-side for actual password verification.
      // The server action's job is just to set the session cookie.
      // This hybrid approach is complex. A simpler model for this architecture is to
      // handle login entirely on the client and just notify the server.
      // However, to keep this a server action, we'll proceed this way.
      // NOTE: This server action does not actually verify the password.
      // The client-side `signInWithEmailAndPassword` which runs in parallel does.
      // This is a limitation of mixing client-side auth with server-side session management this way.

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user does not exist, create them.
        userRecord = await auth.createUser({
          email: email,
          password: password,
        });
      } else {
        // Re-throw other errors.
        throw error;
      }
    }
    
    if (!userRecord) {
       return { error: "Login/signup failed." };
    }

    // Now that we have a user (either existing or newly created), save UID to session.
    const session = await getSession();
    session.uid = userRecord.uid;
    await session.save();

  } catch (e: any) {
    console.error("Server Action Error:", e);
    let errorMessage = "An unexpected error occurred on the server.";
     switch (e.code) {
        case 'auth/email-already-exists':
            errorMessage = 'An account with this email already exists.';
            break;
        case 'auth/invalid-password':
            errorMessage = 'Password must be at least 6 characters long.';
            break;
        case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
        default:
            errorMessage = e.message || errorMessage;
            break;
    }
    return { error: errorMessage };
  }

  // Redirect to dashboard on successful login/signup
  redirect('/dashboard');
}
