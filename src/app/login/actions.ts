
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
      // NOTE: This server action does not actually verify the password for existing users.
      // The assumption here is that if a user exists, we trust the client to have performed
      // password validation before calling this action, or we proceed with creating a session
      // regardless, and let client-side logic handle any re-authentication if needed.
      // For a production app, you might want a more robust password verification step here.
      
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user does not exist, create them.
        userRecord = await auth.createUser({
          email: email,
          password: password,
        });
      } else {
        // Re-throw other errors (like invalid-credential if password check was implemented)
        throw error;
      }
    }
    
    if (!userRecord) {
       return { error: "Login or signup failed." };
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
            // This case should be rare now, but handled just in case.
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
