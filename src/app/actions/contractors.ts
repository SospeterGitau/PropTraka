'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { Contractor } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createContractor(data: Omit<Contractor, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const now = new Date();
    const payload = {
        ...data,
        ownerId: session.uid,
        createdAt: now,
        updatedAt: now,
    };

    await adminDb.collection('contractors').add(payload);
    revalidatePath('/maintenance');
}

export async function updateContractor(id: string, data: Partial<Contractor>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('contractors').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) {
        throw new Error('Unauthorized or not found');
    }

    const payload: any = { ...data, updatedAt: new Date() };

    await docRef.update(payload);
    revalidatePath('/maintenance');
}

export async function deleteContractor(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('contractors').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) {
        throw new Error('Unauthorized or not found');
    }

    await docRef.delete();
    revalidatePath('/maintenance');
}
