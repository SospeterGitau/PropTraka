
'use server';

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { initializeFirebase } from '@/firebase';

// Initialize Firebase Admin
const { auth } = initializeFirebase();


export async function login(formData: {email: string, password: string}) {
  const { email, password } = formData;

  try {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (signInError: any) {
        // If sign-in fails because the user does not exist, create a new user.
        if (signInError.code === 'auth/user-not-found') {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            // Re-throw other sign-in errors
            throw signInError;
        }
    }

    const user = auth.currentUser;

    if (!user) {
        return { error: "Login failed after user creation." };
    }

    const session = await getSession();
    session.uid = user.uid;
    await session.save();

  } catch (e: any) {
    console.error(e);
    // Convert Firebase error codes to user-friendly messages
    let errorMessage = "An unexpected error occurred.";
    switch (e.code) {
        case 'auth/wrong-password':
            errorMessage = 'Invalid password. Please try again.';
            break;
        case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
        case 'auth/user-disabled':
            errorMessage = 'This user account has been disabled.';
            break;
        default:
            errorMessage = e.message;
            break;
    }
    return { error: errorMessage };
  }

  // Redirect to dashboard on successful login/signup
  redirect('/dashboard');
}
