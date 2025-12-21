import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { Tenancy } from '@/lib/types';
import { cache } from 'react';

export const getTenancies = cache(async (propertyId?: string): Promise<Tenancy[]> => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) {
        return [];
    }

    try {
        let query = adminDb.collection('tenancies').where('ownerId', '==', session.uid);

        if (propertyId) {
            query = query.where('propertyId', '==', propertyId);
        }

        const snapshot = await query.get();

        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
                startDate: data.startDate?.toDate?.().toISOString() || data.startDate,
                endDate: data.endDate?.toDate?.().toISOString() || data.endDate,
            };
        }) as unknown as Tenancy[];
    } catch (error) {
        console.error('Error fetching tenancies:', error);
        return [];
    }
});
