
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { properties as initialProperties, revenue as initialRevenue, expenses as initialExpenses } from '@/lib/data';
import type { Property, Transaction, CalendarEvent } from '@/lib/types';

interface DataContextType {
  properties: Property[] | null;
  setProperties: (properties: Property[]) => void;
  revenue: Transaction[] | null;
  setRevenue: (revenue: Transaction[]) => void;
  expenses: Transaction[] | null;
  setExpenses: (expenses: Transaction[]) => void;
  calendarEvents: CalendarEvent[];
  currency: string;
  setCurrency: (currency: string) => void;
  locale: string;
  setLocale: (locale: string) => void;
  formatCurrency: (amount: number) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [revenue, setRevenue] = useState<Transaction[] | null>(null);
  const [expenses, setExpenses] = useState<Transaction[] | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currency, setCurrency] = useState('GBP');
  const [locale, setLocale] = useState('en-GB');

  // Simulate loading data on component mount
  useEffect(() => {
    setProperties(initialProperties);
    setRevenue(initialRevenue);
    setExpenses(initialExpenses);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatCurrencyWithCents = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  useEffect(() => {
    if (!revenue || !expenses) return;

    const events: CalendarEvent[] = [];

    // Use a Set to track which tenancies have already had start/end events created
    const processedTenancies = new Set<string>();

    // Generate events from revenue data for tenancy dates
    revenue.forEach(item => {
       if (item.tenancyId && !processedTenancies.has(item.tenancyId)) {
        if (item.tenancyStartDate) {
          events.push({
            date: item.tenancyStartDate,
            title: `Start: ${item.tenant}`,
            type: 'tenancy-start',
            details: {
              Property: item.propertyName,
              Tenant: item.tenant,
            }
          });
        }
        if (item.tenancyEndDate) {
          events.push({
            date: item.tenancyEndDate,
            title: `End: ${item.tenant}`,
            type: 'tenancy-end',
            details: {
              Property: item.propertyName,
              Tenant: item.tenant,
            }
          });
        }
        processedTenancies.add(item.tenancyId);
       }
    });

    // Generate events from expenses data
    expenses.forEach(item => {
      events.push({
        date: item.date,
        title: `Expense: ${item.category}`,
        type: 'expense',
        details: {
            Property: item.propertyName,
            Category: item.category,
            Vendor: item.vendor,
            Amount: formatCurrencyWithCents(item.amount),
        }
      });
    });

    setCalendarEvents(events);
  }, [revenue, expenses, currency, locale]);

  const value = {
    properties,
    setProperties: setProperties as (properties: Property[]) => void,
    revenue,
    setRevenue: setRevenue as (revenue: Transaction[]) => void,
    expenses,
    setExpenses: setExpenses as (expenses: Transaction[]) => void,
    calendarEvents,
    currency,
    setCurrency,
    locale,
    setLocale,
    formatCurrency,
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
