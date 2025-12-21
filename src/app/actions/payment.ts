'use server';

import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Securely saves payment integration secrets to a write-only (for client) location
 * or a location only accessible via Admin SDK.
 * 
 * We store this in `users/{uid}/private_data/payment_secrets`
 * The security rules should ideally prevent client read access to `private_data`.
 */
export async function savePaymentSecrets(provider: string, secrets: Record<string, string>) {
    const session = await getSession();

    if (!session.isLoggedIn || !session.uid) {
        throw new Error('Unauthorized: You must be logged in.');
    }

    const { uid } = session;

    try {
        // Reference to the secret document
        // We store all provider secrets in one doc or subcollection. 
        // Let's use a single doc for simplicity: `users/{uid}/private_data/secrets`
        // And merge the data.

        // Construct the update object based on provider
        const updateData: Record<string, any> = {};
        if (provider === 'pesapal') {
            updateData['pesapal'] = secrets;
        } else if (provider === 'mpesa-direct') {
            updateData['mpesa'] = secrets;
        } else if (provider === 'airtel-api') {
            updateData['airtel'] = secrets;
        } else {
            throw new Error('Invalid provider for secret storage');
        }

        updateData.updatedAt = new Date().toISOString();

        await adminDb
            .collection('users')
            .doc(uid)
            .collection('private_data')
            .doc('payment_secrets')
            .set(updateData, { merge: true });

        return { success: true };
    } catch (error: any) {
        console.error('Error saving payment secrets:', error);
        throw new Error('Failed to save secure credentials.');
    }
}
