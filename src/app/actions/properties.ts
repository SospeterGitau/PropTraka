'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import type { Property } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createProperty(data: Omit<Property, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    // Hydrate dates from Client String to Server Date/Timestamp
    const payload = {
        ...data,
        ownerId: session.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
    };

    const batch = adminDb.batch();
    const propertyRef = adminDb.collection('properties').doc();
    batch.set(propertyRef, payload);

    const logRef = adminDb.collection('changelog').doc();
    batch.set(logRef, {
        type: 'Property',
        action: 'Created',
        description: `Property "${data.name}" was created.`,
        entityId: propertyRef.id,
        ownerId: session.uid,
        date: new Date()
    });

    await batch.commit();

    revalidatePath('/properties');
}

export async function updateProperty(id: string, data: Partial<Property>) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    // Verify ownership
    const docRef = adminDb.collection('properties').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) {
        throw new Error('Unauthorized or not found');
    }

    const payload: any = { ...data, updatedAt: new Date() };
    if (data.purchaseDate) {
        payload.purchaseDate = new Date(data.purchaseDate);
    }

    const batch = adminDb.batch();
    batch.update(docRef, payload);

    const logRef = adminDb.collection('changelog').doc();
    batch.set(logRef, {
        type: 'Property',
        action: 'Updated',
        description: `Property "${data.name || 'Unknown'}" was updated.`,
        entityId: id,
        ownerId: session.uid,
        date: new Date()
    });

    await batch.commit();

    revalidatePath('/properties');
}

export async function deleteProperty(id: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) throw new Error('Unauthorized');

    const docRef = adminDb.collection('properties').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.ownerId !== session.uid) {
        throw new Error('Unauthorized or not found');
    }

    const batch = adminDb.batch();

    // 1. Delete Property
    batch.delete(docRef);

    const logRef = adminDb.collection('changelog').doc();
    batch.set(logRef, {
        type: 'Property',
        action: 'Deleted',
        description: `Property was deleted.`,
        entityId: id,
        ownerId: session.uid,
        date: new Date()
    });

    // 2. Cascading Deletes (Tenancies, Revenue, Expenses, Maintenance, AppDocs)
    // Helper to delete collection queries
    const deleteQueryBatch = async (collectionName: string, field: string) => {
        const q = await adminDb.collection(collectionName)
            .where(field, '==', id)
            .where('ownerId', '==', session.uid!)
            .get();
        q.docs.forEach(doc => batch.delete(doc.ref));
    };

    await deleteQueryBatch('tenancies', 'propertyId');
    await deleteQueryBatch('revenue', 'propertyId');
    await deleteQueryBatch('expenses', 'propertyId');
    await deleteQueryBatch('maintenanceRequests', 'propertyId');
    // For AppDocs, logic might be more complex if they are polymorphic, but assuming simple link for now:
    await deleteQueryBatch('appDocuments', 'propertyId');

    await batch.commit();
    revalidatePath('/properties');
}
