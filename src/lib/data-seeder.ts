'use server';

import { writeBatch, collection, getDocs, query, where, doc } from 'firebase/firestore';
import { getFirebase } from '@/firebase/server-provider';
import sampleProperties from './sample-data/properties.json';
import sampleContractors from './sample-data/contractors.json';
import sampleTenancies from './sample-data/tenancies.json';
import sampleExpenses from './sample-data/expenses.json';
import sampleMaintenance from './sample-data/maintenance.json';
import { format, getDaysInMonth, isSameMonth } from 'date-fns';

function createSafeMonthDate(year: number, month: number, day: number): Date {
  const date = new Date(year, month, day);
  if (date.getDate() !== day) {
    return new Date(year, month + 1, 0);
  }
  return date;
}

export async function seedSampleData(userId: string) {
  const { firestore } = await getFirebase();
  const batch = writeBatch(firestore);

  // 1. Seed Properties
  const propertyIdMap = new Map<string, string>();
  sampleProperties.forEach(prop => {
    const docRef = doc(collection(firestore, 'properties'));
    const { id, ...rest } = prop;
    batch.set(docRef, { ...rest, ownerId: userId });
    propertyIdMap.set(id, docRef.id);
  });

  // 2. Seed Contractors
  const contractorIdMap = new Map<string, string>();
  sampleContractors.forEach(cont => {
    const docRef = doc(collection(firestore, 'contractors'));
    const { id, ...rest } = cont;
    batch.set(docRef, { ...rest, ownerId: userId });
    contractorIdMap.set(id, docRef.id);
  });

  // 3. Seed Tenancies (Revenue)
  sampleTenancies.forEach(tenancy => {
    const tenancyId = `t${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tenancyStartDate = new Date(tenancy.startDate);
    const tenancyEndDate = new Date(tenancy.endDate);
    const dayOfMonth = tenancyStartDate.getDate();

    const realPropertyId = propertyIdMap.get(tenancy.propertyId);
    if (!realPropertyId) return;
    const propertyDetails = sampleProperties.find(p => p.id === tenancy.propertyId);

    let currentDate = new Date(tenancyStartDate.getFullYear(), tenancyStartDate.getMonth(), 1);
    while (currentDate <= tenancyEndDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const isFirstMonth = isSameMonth(currentDate, tenancyStartDate);
        const isLastMonth = isSameMonth(currentDate, tenancyEndDate);
        
        const dueDate = createSafeMonthDate(year, month, dayOfMonth);
        const daysInMonth = getDaysInMonth(currentDate);

        let rentForPeriod = tenancy.rent;
        let proRataNotes: string | undefined = undefined;

        if (isFirstMonth && isLastMonth) {
          const occupiedDays = tenancyEndDate.getDate() - tenancyStartDate.getDate() + 1;
          rentForPeriod = (tenancy.rent / daysInMonth) * occupiedDays;
          proRataNotes = `Pro-rated rent for ${occupiedDays} days.`;
        } else if (isFirstMonth) {
          const occupiedDays = daysInMonth - tenancyStartDate.getDate() + 1;
          if (occupiedDays < daysInMonth) {
            rentForPeriod = (tenancy.rent / daysInMonth) * occupiedDays;
            proRataNotes = `Pro-rated rent for ${occupiedDays} days in the first month.`;
          }
        } else if (isLastMonth) {
          const occupiedDays = tenancyEndDate.getDate();
          if (occupiedDays < daysInMonth) {
             rentForPeriod = (tenancy.rent / daysInMonth) * occupiedDays;
             proRataNotes = `Pro-rated rent for ${occupiedDays} days in the final month.`;
          }
        }
        
        rentForPeriod = Math.round(rentForPeriod * 100) / 100;
        const totalDueThisMonth = rentForPeriod + (isFirstMonth ? tenancy.deposit : 0) + (tenancy.serviceCharges || []).reduce((sum, sc) => sum + sc.amount, 0);

        const newTxData = {
            tenancyId,
            date: format(dueDate, 'yyyy-MM-dd'),
            rent: rentForPeriod,
            serviceCharges: tenancy.serviceCharges,
            amountPaid: dueDate < new Date() ? totalDueThisMonth : 0, // Mark past invoices as paid
            propertyId: realPropertyId,
            propertyName: `${propertyDetails?.addressLine1}, ${propertyDetails?.city}`,
            tenant: tenancy.tenantName,
            tenantEmail: tenancy.tenantEmail,
            tenantPhone: tenancy.tenantPhone,
            type: 'revenue' as const,
            deposit: isFirstMonth ? tenancy.deposit : 0,
            tenancyStartDate: tenancy.startDate,
            tenancyEndDate: tenancy.endDate,
            ownerId: userId,
            notes: proRataNotes,
        };
      
        const docRef = doc(collection(firestore, 'revenue'));
        batch.set(docRef, newTxData);
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
  });

  // 4. Seed Expenses
  sampleExpenses.forEach(exp => {
    const docRef = doc(collection(firestore, 'expenses'));
    const realPropertyId = exp.propertyId ? propertyIdMap.get(exp.propertyId) : undefined;
    const propertyDetails = sampleProperties.find(p => p.id === exp.propertyId);
    const realContractorId = exp.contractorId ? contractorIdMap.get(exp.contractorId) : undefined;
    const contractorDetails = sampleContractors.find(c => c.id === exp.contractorId);

    batch.set(docRef, {
      ...exp,
      propertyId: realPropertyId,
      propertyName: realPropertyId ? `${propertyDetails?.addressLine1}, ${propertyDetails?.city}` : 'General Expense',
      contractorId: realContractorId,
      contractorName: realContractorId ? contractorDetails?.name : undefined,
      ownerId: userId,
      type: 'expense'
    });
  });

  // 5. Seed Maintenance Requests
  sampleMaintenance.forEach(req => {
    const docRef = doc(collection(firestore, 'maintenanceRequests'));
    const realPropertyId = req.propertyId ? propertyIdMap.get(req.propertyId) : undefined;
    const propertyDetails = sampleProperties.find(p => p.id === req.propertyId);
    const realContractorId = req.contractorId ? contractorIdMap.get(req.contractorId) : undefined;
    const contractorDetails = sampleContractors.find(c => c.id === req.contractorId);

    batch.set(docRef, {
        ...req,
        propertyId: realPropertyId,
        propertyName: realPropertyId ? `${propertyDetails?.addressLine1}, ${propertyDetails?.city}` : 'General Task',
        contractorId: realContractorId,
        contractorName: realContractorId ? contractorDetails?.name : undefined,
        ownerId: userId
    });
  });

  await batch.commit();
}

export async function clearSampleData(userId: string) {
    const { firestore } = await getFirebase();
    const collections = ['properties', 'revenue', 'expenses', 'maintenanceRequests', 'contractors'];
    
    const batch = writeBatch(firestore);

    for (const coll of collections) {
        const q = query(collection(firestore, coll), where('ownerId', '==', userId));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    await batch.commit();
}