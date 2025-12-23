import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { MaintenanceRequest, Contractor } from '@/lib/types';
import { cache } from 'react';

export const getMaintenanceRequests = cache(async (): Promise<MaintenanceRequest[]> => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) return [];

    try {
        const snapshot = await adminDb
            .collection('maintenanceRequests')
            .where('ownerId', '==', session.uid)
            .get();

        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
                scheduledDate: data.scheduledDate?.toDate?.().toISOString() || data.scheduledDate,
                completedDate: data.completedDate?.toDate?.().toISOString() || data.completedDate,
            };
        }) as unknown as MaintenanceRequest[];
    } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        return [];
    }
});

export const getContractors = cache(async (): Promise<Contractor[]> => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) return [];

    try {
        const snapshot = await adminDb
            .collection('contractors')
            .where('ownerId', '==', session.uid)
            .get();

        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
            };
        }) as unknown as Contractor[];
    } catch (error) {
        console.error('Error fetching contractors:', error);
        return [];
    }
});
