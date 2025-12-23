import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { UserSettings } from '@/lib/types';
import { cache } from 'react';

export const getUserSettings = cache(async (): Promise<UserSettings | null> => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) return null;

    try {
        const docSnap = await adminDb.collection('userSettings').doc(session.uid).get();

        if (!docSnap.exists) return null;

        return docSnap.data() as UserSettings;
    } catch (error) {
        console.error('Error fetching user settings:', error);
        return null;
    }
});
