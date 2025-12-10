
'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { useUser, useFirestore } from '@/firebase';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import type { Query } from 'firebase/firestore';
import type { Transaction, MaintenanceRequest, CalendarEvent, Expense } from '@/lib/types';
import { useDataContext } from '@/context/data-context';
import { CalendarView } from '@/components/calendar-view';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';

export default function CalendarPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings, revenue, maintenanceRequests, expenses } = useDataContext();
  const locale = settings?.locale || 'en-KE';
  const currency = settings?.currency || 'KES';

  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];
    const processedTenancies = new Set<string>();

    // Add revenue/rent due events
    revenue.forEach(item => {
      if (item.tenancyId && !processedTenancies.has(item.tenancyId)) {
        if (item.tenancyStartDate) {
          calendarEvents.push({
            date: item.tenancyStartDate,
            title: `Start: ${item.tenant}`,
            type: 'tenancy-start',
            details: { Property: item.propertyName, Tenant: item.tenant }
          });
        }
        if (item.tenancyEndDate) {
          calendarEvents.push({
            date: item.tenancyEndDate,
            title: `End: ${item.tenant}`,
            type: 'tenancy-end',
            details: { Property: item.propertyName, Tenant: item.tenant }
          });
        }
        processedTenancies.add(item.tenancyId);
      }
      if (item.dueDate) {
        calendarEvents.push({
          date: item.dueDate,
          title: `Rent Due: ${item.tenant}`,
          type: 'rent_due',
          details: { 
            Property: item.propertyName, 
            Tenant: item.tenant,
            Amount: formatCurrency(item.rent || 0, locale, currency)
          }
        });
      }
    });

    // Add maintenance events
    maintenanceRequests.forEach(item => {
      calendarEvents.push({
        date: item.reportedDate,
        title: `Maintenance: ${item.title}`,
        type: 'maintenance',
        details: {
          Property: item.propertyName,
          Priority: item.priority,
          Status: item.status,
          Description: item.description,
        }
      });
    });

    // Add expense events
    (expenses as Expense[]).forEach(item => {
      if (item.date) {
        calendarEvents.push({
          date: item.date,
          title: `Expense: ${item.category}`,
          type: 'expense',
          details: {
            Category: item.category,
            Vendor: item.contractorName,
            Amount: formatCurrency(item.amount || 0, locale, currency)
          }
        });
      }
    });

    return calendarEvents;
  }, [revenue, maintenanceRequests, expenses, locale, currency]);

  return (
    <>
      <PageHeader title="Calendar" />
      <Card>
        <CardHeader>
          <CardTitle>Property Management Calendar</CardTitle>
          <CardDescription>View all rent due dates, maintenance, and expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarView events={events} />
        </CardContent>
      </Card>
    </>
  );
}
