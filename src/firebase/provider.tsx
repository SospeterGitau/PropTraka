
'use client';

import { useEffect, ReactNode } from 'react';
import { auth } from '@/firebase';
import { createSession } from '@/app/actions';

/**
 * This provider is responsible for keeping the server-side session in sync 
 * with the client-side Firebase auth state. When a user signs in, signs out,
 * or their token is refreshed, it notifies the server to update the session cookie.
 */
export function FirebaseProvider({
    children,
}: {
    children: ReactNode;
}) {
    useEffect(() => {
        // onIdTokenChanged is the recommended listener for session management.
        // It triggers on sign-in, sign-out, and token refresh.
        const unsubscribe = auth.onIdTokenChanged(async (user) => {
            if (user) {
                // If a user is signed in (or their token has been refreshed),
                // call the server action to create or update the session cookie.
                await createSession();
            } 
            // Note: We don't need an 'else' block to handle sign-out.
            // The /actions.ts file, which handles the session, will clear the cookie
            // when it can no longer verify the user's token.
        });

        // Cleanup the subscription when the component unmounts.
        return () => unsubscribe();
    }, []);

    // The provider simply renders its children. Its work is done in the useEffect hook.
    return <>{children}</>;
}
