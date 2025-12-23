
import {
    collection,
    addDoc,
    writeBatch,
    doc,
    Timestamp,
    query,
    where,
    getDocs,
    deleteDoc
} from 'firebase/firestore';
import { firestore as db } from '@/firebase';
import type { Property, Tenant, Tenancy, RevenueTransaction } from './db-types';

export const SAMPLE_DATA_TAG = true;

const SAMPLE_PROPERTIES = (userId: string): Omit<Property, 'id' | 'createdAt' | 'updatedAt'>[] => [
    {
        ownerId: userId,
        name: 'The Lofts at Downtown',
        type: 'Residential',
        address: {
            street: '123 Market St',
            city: 'Nairobi',
            state: 'Nairobi',
            zipCode: '00100',
            country: 'Kenya'
        },
        addressLine1: '123 Market St', // Compat
        city: 'Nairobi', // Compat
        targetRent: 45000,
        purchasePrice: 12000000,
        purchaseDate: Timestamp.now(), // Simplified
        isSample: true,
    },
    {
        ownerId: userId,
        name: 'Greenwood Estate Villa',
        type: 'Residential',
        address: {
            street: '45 Palm Grove',
            city: 'Mombasa',
            state: 'Mombasa',
            zipCode: '80100',
            country: 'Kenya'
        },
        addressLine1: '45 Palm Grove', // Compat
        city: 'Mombasa', // Compat
        targetRent: 85000,
        purchasePrice: 25000000,
        purchaseDate: Timestamp.now(),
        isSample: true,
    }
];

const SAMPLE_TENANTS = (userId: string): Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>[] => [
    {
        ownerId: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+254712345678',
        idType: 'National ID',
        idNumber: '12345678',
        isSample: true,
    },
    {
        ownerId: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '+254787654321',
        idType: 'Passport',
        idNumber: 'A1234567',
        isSample: true,
    }
];

export async function generateSampleData(userId: string) {
    console.log("Generating sample data for user:", userId);
    const batch = writeBatch(db);
    const now = Timestamp.now();

    // 1. Create Properties
    const createdProperties: { id: string, name: string }[] = [];
    for (const propData of SAMPLE_PROPERTIES(userId)) {
        const ref = doc(collection(db, 'properties'));
        batch.set(ref, { ...propData, createdAt: now, updatedAt: now });
        createdProperties.push({ id: ref.id, name: propData.name });
    }

    // 2. Create Tenants
    const createdTenants: { id: string, name: string }[] = [];
    for (const tenantData of SAMPLE_TENANTS(userId)) {
        const ref = doc(collection(db, 'tenants'));
        batch.set(ref, { ...tenantData, createdAt: now, updatedAt: now });
        createdTenants.push({ id: ref.id, name: `${tenantData.firstName} ${tenantData.lastName}` });
    }

    // 3. Create a Tenancy linking first property and first tenant
    if (createdProperties.length > 0 && createdTenants.length > 0) {
        const prop = createdProperties[0];
        const tenant = createdTenants[0];
        const tenancyRef = doc(collection(db, 'tenancies'));

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6); // Started 6 months ago
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // Ends in a year

        const newTenancy: Omit<Tenancy, 'id'> = {
            ownerId: userId,
            propertyId: prop.id,
            tenantId: tenant.id,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            rentAmount: 45000,
            depositAmount: 90000,
            paymentFrequency: 'Monthly',
            rentDay: 5,
            status: 'Active',
            isSample: true,
            createdAt: now,
            updatedAt: now,
        };
        batch.set(tenancyRef, newTenancy);

        // 4. Generate some past transactions for this tenancy
        for (let i = 0; i < 6; i++) {
            const txDate = new Date(startDate);
            txDate.setMonth(txDate.getMonth() + i);
            txDate.setDate(5); // Rent due day

            const txRef = doc(collection(db, 'revenue'));
            const tx: Omit<RevenueTransaction, 'id'> = {
                ownerId: userId,
                tenancyId: tenancyRef.id,
                propertyId: prop.id,
                amount: 45000,
                amountPaid: i < 5 ? 45000 : 0, // Last one unpaid
                rent: 45000,
                date: Timestamp.fromDate(txDate),
                type: 'Rent',
                paymentMethod: i < 5 ? 'M-Pesa' : 'Other',
                status: i < 5 ? 'Paid' : 'Overdue',
                invoiceNumber: `INV-SAMPLE-${i}`,
                notes: 'Sample Rent Transaction',
                isSample: true,
                createdAt: now,
                updatedAt: now,
            };
            batch.set(txRef, tx);
        }
    }

    await batch.commit();
    console.log("Sample data generated successfully.");
}

export async function clearSampleData(userId: string) {
    if (!userId) return;
    console.log("Clearing sample data for user:", userId);

    const collections = ['properties', 'tenants', 'tenancies', 'revenue', 'expenses', 'contractors', 'maintenanceRequests'];
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    for (const colName of collections) {
        const q = query(collection(db, colName), where('ownerId', '==', userId), where('isSample', '==', true));
        const snapshot = await getDocs(q);

        for (const dock of snapshot.docs) {
            currentBatch.delete(dock.ref);
            operationCount++;

            if (operationCount >= 450) { // Firestore batch limit is 500
                batches.push(currentBatch.commit());
                currentBatch = writeBatch(db);
                operationCount = 0;
            }
        }
    }

    if (operationCount > 0) {
        batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
    console.log("Sample data cleared.");
}
