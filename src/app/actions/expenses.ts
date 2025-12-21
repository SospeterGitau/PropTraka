'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { Expense } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createExpense(data: Omit<Expense, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const payload = {
        ...data,
        ownerId: session.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        date: data.date ? new Date(data.date) : new Date(),
    };

    await adminDb.collection('expenses').add(payload);
    revalidatePath('/expenses');
}

export async function updateExpense(id: string, data: Partial<Expense>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('expenses').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) throw new Error('Unauthorized');

    const payload: any = { ...data, updatedAt: new Date() };
    if (data.date) {
        payload.date = new Date(data.date);
    }

    await docRef.update(payload);
    revalidatePath('/expenses');
}

export async function deleteExpense(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('expenses').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) throw new Error('Unauthorized');

    await docRef.delete();
    revalidatePath('/expenses');
}
