'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { Tenant } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createTenant(data: Omit<Tenant, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const payload = {
        ...data,
        ownerId: session.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    };

    await adminDb.collection('tenants').add(payload);
    revalidatePath('/tenants');
}

export async function updateTenant(id: string, data: Partial<Tenant>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('tenants').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) {
        throw new Error('Unauthorized or not found');
    }

    const payload: any = { ...data, updatedAt: new Date() };
    if (data.dateOfBirth) {
        payload.dateOfBirth = new Date(data.dateOfBirth);
    }

    await docRef.update(payload);
    revalidatePath('/tenants');
}

export async function deleteTenant(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('tenants').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) {
        throw new Error('Unauthorized or not found');
    }

    // TODO: Verify cascading deletes? (e.g. Tenancies for this tenant?)
    // For now, simple delete. User should manage tenancies manually or we cascade.
    // Ideally we assume strict integrity: if tenant deleted, tenancies should probably close or be flagged.

    await docRef.delete();
    revalidatePath('/tenants');
}
