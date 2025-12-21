import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { Property } from '@/lib/types';
import { cache } from 'react';

export const getProperties = cache(async (): Promise<Property[]> => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) {
        return [];
    }

    try {
        const snapshot = await adminDb
            .collection('properties')
            .where('ownerId', '==', session.uid)
            .get(); // In future: .orderBy('createdAt', 'desc') requires index

        if (snapshot.empty) {
            return [];
        }

        const properties = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
                purchaseDate: data.purchaseDate?.toDate?.().toISOString() || data.purchaseDate,
            };
        }) as unknown as Property[];

        return properties;
    } catch (error) {
        console.error('Error fetching properties:', error);
        return [];
    }
});

export const getProperty = cache(async (id: string): Promise<Property | null> => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) return null;

    try {
        const docSnap = await adminDb.collection('properties').doc(id).get();
        if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) return null;

        const data = docSnap.data();
        if (!data) return null;

        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
            purchaseDate: data.purchaseDate?.toDate?.().toISOString() || data.purchaseDate,
        } as unknown as Property;
    } catch (error) {
        console.error('Error fetching property:', error);
        return null;
    }
});
