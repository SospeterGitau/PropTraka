import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { RevenueTransaction, Expense } from '@/lib/types';
import { cache } from 'react';

export const getRevenue = cache(async (): Promise<RevenueTransaction[]> => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) {
        return [];
    }

    try {
        const snapshot = await adminDb
            .collection('revenue')
            .where('ownerId', '==', session.uid)
            .orderBy('date', 'desc')
            .get();

        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
                date: data.date?.toDate?.().toISOString() || data.date,
            };
        }) as unknown as RevenueTransaction[];
    } catch (error) {
        console.error('Error fetching revenue:', error);
        return [];
    }
});

export const getExpenses = cache(async (): Promise<Expense[]> => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) {
        return [];
    }

    try {
        const snapshot = await adminDb
            .collection('expenses')
            .where('ownerId', '==', session.uid)
            .orderBy('date', 'desc')
            .get();

        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
                date: data.date?.toDate?.().toISOString() || data.date,
            };
        }) as unknown as Expense[];
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return [];
    }
});
