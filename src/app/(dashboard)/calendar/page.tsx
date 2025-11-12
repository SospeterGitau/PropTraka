
'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { CalendarView } from '@/components/calendar-view';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Transaction, MaintenanceRequest, CalendarEvent } from '@/lib/types';


function CalendarPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const revenueQuery = useMemo(() => user?.uid ? query(collection(firestore, 'revenue'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);
  const expensesQuery = useMemo(() => user?.uid ? query(collection(firestore, 'expenses'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);
  const maintenanceRequestsQuery = useMemo(() => user?.uid ? query(collection(firestore, 'maintenanceRequests'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);
  
  const { data: revenue, loading: isRevenueLoading } = useCollection<Transaction>(revenueQuery);
  const { data: expenses, loading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);
  const { data: maintenanceRequests, loading: isMaintenanceLoading } = useCollection<MaintenanceRequest>(maintenanceRequestsQuery);


  const formatCurrencyWithCents = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const calendarEvents = useMemo(() => {
    if (!revenue || !expenses || !maintenanceRequests) return [];
  
    const events: CalendarEvent[] = [];
    const processedTenancies = new Set<string>();
  
    revenue.forEach(item => {
      if (item.tenancyId && !processedTenancies.has(item.tenancyId)) {
        if (item.tenancyStartDate) {
          events.push({
            date: item.tenancyStartDate,
            title: `Start: ${item.tenant}`,
            type: 'tenancy-start',
            details: { Property: item.propertyName, Tenant: item.tenant }
          });
        }
        if (item.tenancyEndDate) {
          events.push({
            date: item.tenancyEndDate,
            title: `End: ${item.tenant}`,
            type: 'tenancy-end',
            details: { Property: item.propertyName, Tenant: item.tenant }
          });
        }
        processedTenancies.add(item.tenancyId);
      }
    });
  
    expenses.forEach(item => {
      events.push({
        date: item.date,
        title: `Expense: ${item.category}`,
        type: 'expense',
        details: {
          Property: item.propertyName,
          Category: item.category,
          Vendor: item.contractorName,
          Amount: formatCurrencyWithCents(item.amount || 0),
        }
      });
    });
  
    maintenanceRequests.forEach(item => {
      events.push({
        date: item.reportedDate,
        title: `Maint: ${item.description}`,
        type: 'appointment',
        details: {
          Property: item.propertyName,
          Status: item.status,
          Priority: item.priority,
          Vendor: item.contractorName,
        }
      });
    });
  
    return events;
  }, [revenue, expenses, maintenanceRequests]);

  return (
    <>
      <PageHeader title="Calendar" />
      <CalendarView events={calendarEvents} />
    </>
  );
}


export default CalendarPage;



