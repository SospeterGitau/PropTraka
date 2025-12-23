'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { MaintenanceRequest } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createMaintenanceRequest(data: Omit<MaintenanceRequest, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const now = new Date();
    const payload = {
        ...data,
        ownerId: session.uid,
        createdAt: now,
        updatedAt: now,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        completedDate: data.completedDate ? new Date(data.completedDate) : undefined,
    };

    await adminDb.collection('maintenanceRequests').add(payload);
    revalidatePath('/maintenance');
}

export async function updateMaintenanceRequest(id: string, data: Partial<MaintenanceRequest>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('maintenanceRequests').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) {
        throw new Error('Unauthorized or not found');
    }

    const payload: any = { ...data, updatedAt: new Date() };
    if (data.dueDate) payload.dueDate = new Date(data.dueDate);
    if (data.scheduledDate) payload.scheduledDate = new Date(data.scheduledDate);
    if (data.completedDate) payload.completedDate = new Date(data.completedDate);

    await docRef.update(payload);
    revalidatePath('/maintenance');
}

export async function deleteMaintenanceRequest(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('maintenanceRequests').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) {
        throw new Error('Unauthorized or not found');
    }

    await docRef.delete();
    revalidatePath('/maintenance');
}
