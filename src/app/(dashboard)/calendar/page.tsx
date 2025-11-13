
'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { CalendarView } from '@/components/calendar-view';
import { useCollection } from '@/firebase';
import type { Transaction, MaintenanceRequest, CalendarEvent } from '@/lib/types';


function CalendarPage() {
  const { data: revenue, loading: isRevenueLoading } = useCollection<Transaction>('revenue');
  const { data: expenses, loading: isExpensesLoading } = useCollection<Transaction>('expenses');
  const { data: maintenanceRequests, loading: isMaintenanceLoading } = useCollection<MaintenanceRequest>('maintenanceRequests');

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
