'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { RevenueTransaction } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createRevenue(data: Omit<RevenueTransaction, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const payload = {
        ...data,
        ownerId: session.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        date: data.date ? new Date(data.date) : new Date(),
    };

    await adminDb.collection('revenue').add(payload);
    revalidatePath('/revenue');
}

export async function updateRevenue(id: string, data: Partial<RevenueTransaction>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('revenue').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) throw new Error('Unauthorized');

    const payload: any = { ...data, updatedAt: new Date() };
    if (data.date) {
        payload.date = new Date(data.date);
    }

    await docRef.update(payload);
    revalidatePath('/revenue');
}

export async function deleteRevenue(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('revenue').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) throw new Error('Unauthorized');

    await docRef.delete();
    revalidatePath('/revenue');
}

export async function deleteTenancyRevenue(tenancyId: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const snapshot = await adminDb.collection('revenue')
        .where('tenancyId', '==', tenancyId)
        .where('ownerId', '==', session.uid)
        .get();

    if (snapshot.empty) return;

    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    revalidatePath('/revenue');
}
