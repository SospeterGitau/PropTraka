'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { getDaysInMonth, format } from 'date-fns';
import type { RevenueTransaction, Tenancy, Tenant } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore'; // Note: admin SDK uses different Timestamp export location typically, or just use Date

// Helper
function createSafeMonthDate(year: number, month: number, day: number): Date {
    const date = new Date(year, month, day);
    if (date.getDate() !== day) {
        return new Date(year, month + 1, 0);
    }
    return date;
}

interface ServiceCharge {
    name: string;
    amount: number;
}

interface CreateTenancyPayload {
    propertyId: string;
    startDate: string; // ISO
    endDate: string; // ISO
    rentAmount: number;
    depositAmount: number;
    rentDueDay: number;
    paymentFrequency: 'Monthly' | 'Quarterly' | 'Annually';
    serviceCharges: ServiceCharge[];

    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    idType: Tenant['idType']; // 'National ID' | 'Passport' ...
    idNumber: string;
    tenantNotes?: string;

    leaseAgreementUrl?: string;
    moveInChecklistUrl?: string;
}

export async function createTenancy(payload: CreateTenancyPayload) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) {
        throw new Error('Unauthorized');
    }
    const userId = session.uid;

    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);
    const now = new Date();

    const batch = adminDb.batch();

    // 1. Create Tenant
    const tenantRef = adminDb.collection('tenants').doc();
    const tenant: Tenant = {
        id: tenantRef.id,
        ownerId: userId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        idType: payload.idType,
        idNumber: payload.idNumber,
        notes: payload.tenantNotes,
        createdAt: now.toISOString(), // Standardizing on ISO strings for Types
        updatedAt: now.toISOString(),
    };

    batch.set(tenantRef, {
        ...tenant,
        createdAt: now,
        updatedAt: now,
    });


    // 2. Create Tenancy
    const tenancyRef = adminDb.collection('tenancies').doc();
    const tenancy: Tenancy = {
        id: tenancyRef.id,
        ownerId: userId,
        propertyId: payload.propertyId,
        tenantId: tenantRef.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        rentAmount: payload.rentAmount,
        depositAmount: payload.depositAmount,
        serviceChargeAmount: payload.serviceCharges.reduce((sum, sc) => sum + sc.amount, 0),
        paymentFrequency: payload.paymentFrequency,
        status: 'Active',
        leaseAgreementUrl: payload.leaseAgreementUrl,
        moveInChecklistUrl: payload.moveInChecklistUrl,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };

    batch.set(tenancyRef, {
        ...tenancy,
        startDate: startDate,
        endDate: endDate,
        createdAt: now,
        updatedAt: now,
    });

    // 3. Transactions

    // A. Deposit
    if (payload.depositAmount > 0) {
        const depositRef = adminDb.collection('revenue').doc();
        const depositTx = {
            id: depositRef.id,
            revenueTransactionId: depositRef.id,
            ownerId: userId,
            tenancyId: tenancyRef.id,
            propertyId: payload.propertyId,
            tenantId: tenantRef.id,
            amount: payload.depositAmount,
            date: startDate,
            type: 'Deposit',
            paymentMethod: 'Other',
            status: 'Overdue',
            invoiceNumber: `DEP-${tenancyRef.id}`,
            notes: 'Security Deposit',
            createdAt: now,
            updatedAt: now,
        };
        batch.set(depositRef, depositTx);
    }

    // B. Rent Loop
    let iterationDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonthDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (iterationDate <= endMonthDate) {
        const currentYear = iterationDate.getFullYear();
        const currentMonth = iterationDate.getMonth();
        const daysInCurrentMonth = getDaysInMonth(iterationDate);

        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth, daysInCurrentMonth);

        const periodStart = (startDate > monthStart) ? new Date(startDate) : monthStart;
        periodStart.setHours(0, 0, 0, 0);

        let periodEnd = (endDate < monthEnd) ? new Date(endDate) : monthEnd;
        periodEnd.setHours(0, 0, 0, 0);

        const timeDiff = periodEnd.getTime() - periodStart.getTime();
        const daysActive = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

        if (daysActive > 0) {
            const isFullMonth = daysActive === daysInCurrentMonth;

            const monthlyRent = payload.rentAmount;
            const proratedRent = isFullMonth
                ? monthlyRent
                : Number(((monthlyRent / daysInCurrentMonth) * daysActive).toFixed(2));

            let invoiceDate: Date;
            if (currentYear === startDate.getFullYear() && currentMonth === startDate.getMonth()) {
                invoiceDate = new Date(startDate);
            } else {
                invoiceDate = createSafeMonthDate(currentYear, currentMonth, payload.rentDueDay);
            }

            const note = isFullMonth
                ? format(iterationDate, 'MMMM yyyy')
                : `Pro-rata: ${format(periodStart, 'MMM d')} - ${format(periodEnd, 'MMM d')} (${daysActive} days)`;

            // Rent Tx
            const rentRef = adminDb.collection('revenue').doc();
            const rentTx = {
                id: rentRef.id,
                revenueTransactionId: rentRef.id,
                ownerId: userId,
                tenancyId: tenancyRef.id,
                propertyId: payload.propertyId,
                tenantId: tenantRef.id,
                amount: proratedRent,
                date: invoiceDate,
                type: 'Rent',
                paymentMethod: 'Other',
                status: 'Overdue',
                invoiceNumber: `INV-${tenancyRef.id}-${format(invoiceDate, 'yyyyMMdd')}`,
                notes: `Rent: ${note}`,
                createdAt: now,
                updatedAt: now,
            };
            batch.set(rentRef, rentTx);

            // Service Charges
            payload.serviceCharges.forEach(sc => {
                const proratedAmount = isFullMonth
                    ? sc.amount
                    : Number(((sc.amount / daysInCurrentMonth) * daysActive).toFixed(2));

                if (proratedAmount > 0) {
                    const scRef = adminDb.collection('revenue').doc();
                    const scTx = {
                        id: scRef.id,
                        revenueTransactionId: scRef.id,
                        ownerId: userId,
                        tenancyId: tenancyRef.id,
                        propertyId: payload.propertyId,
                        tenantId: tenantRef.id,
                        amount: proratedAmount,
                        date: invoiceDate,
                        type: 'Service Charge',
                        paymentMethod: 'Other',
                        status: 'Overdue',
                        invoiceNumber: `SC-${tenancyRef.id}-${sc.name.substring(0, 3).toUpperCase()}-${format(invoiceDate, 'yyyyMMdd')}`,
                        notes: `${sc.name}: ${note}`,
                        createdAt: now,
                        updatedAt: now,
                    };
                    batch.set(scRef, scTx);
                }
            });
        }
        // Increment
        iterationDate = new Date(currentYear, currentMonth + 1, 1);
    }

    // Changelog
    const logRef = adminDb.collection('changelog').doc();
    batch.set(logRef, {
        type: 'Tenancy',
        action: 'Created',
        description: `Tenancy for "${payload.firstName} ${payload.lastName}" was created.`,
        entityId: tenancyRef.id,
        ownerId: userId,
        date: now
    });

    await batch.commit();
    revalidatePath('/revenue');
    revalidatePath('/tenants');
    return { success: true, tenancyId: tenancyRef.id };
}
