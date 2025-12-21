import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { Tenant } from '@/lib/types';
import { cache } from 'react';

export const getTenants = cache(async (): Promise<Tenant[]> => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) {
        return [];
    }

    try {
        const snapshot = await adminDb
            .collection('tenants')
            .where('ownerId', '==', session.uid)
            .get(); // In future: .orderBy('createdAt', 'desc').limit(50)

        if (snapshot.empty) {
            return [];
        }

        const tenants = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
                dateOfBirth: data.dateOfBirth?.toDate?.().toISOString() || data.dateOfBirth,
            };
        }) as unknown as Tenant[];

        return tenants;
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return [];
    }
});
