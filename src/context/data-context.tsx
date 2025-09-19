'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { properties as initialProperties, revenue as initialRevenue, expenses as initialExpenses } from '@/lib/data';
import type { Property, Transaction, CalendarEvent } from '@/lib/types';

interface DataContextType {
  properties: Property[];
  setProperties: (properties: Property[]) => void;
  revenue: Transaction[];
  setRevenue: (revenue: Transaction[]) => void;
  expenses: Transaction[];
  setExpenses: (expenses: Transaction[]) => void;
  calendarEvents: CalendarEvent[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [revenue, setRevenue] = useState<Transaction[]>(initialRevenue);
  const [expenses, setExpenses] = useState<Transaction[]>(initialExpenses);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const events: CalendarEvent[] = [];

    // Generate events from revenue data
    revenue.forEach(item => {
      if (item.tenancyStartDate) {
        events.push({
          date: item.tenancyStartDate,
          title: `Tenancy Starts: ${item.tenant} (${item.propertyName})`,
          type: 'tenancy-start',
        });
      }
      if (item.tenancyEndDate) {
        events.push({
          date: item.tenancyEndDate,
          title: `Tenancy Ends: ${item.tenant} (${item.propertyName})`,
          type: 'tenancy-end',
        });
      }
    });

    // Generate events from expenses data
    expenses.forEach(item => {
      events.push({
        date: item.date,
        title: `Expense: ${item.category} (${item.propertyName})`,
        type: 'expense',
      });
    });

    setCalendarEvents(events);
  }, [revenue, expenses]);

  const value = {
    properties,
    setProperties,
    revenue,
    setRevenue,
    expenses,
    setExpenses,
    calendarEvents,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}
