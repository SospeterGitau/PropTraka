'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { properties as initialProperties, revenue as initialRevenue, expenses as initialExpenses } from '@/lib/data';
import type { Property, Transaction } from '@/lib/types';

interface DataContextType {
  properties: Property[];
  setProperties: (properties: Property[]) => void;
  revenue: Transaction[];
  setRevenue: (revenue: Transaction[]) => void;
  expenses: Transaction[];
  setExpenses: (expenses: Transaction[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [revenue, setRevenue] = useState<Transaction[]>(initialRevenue);
  const [expenses, setExpenses] = useState<Transaction[]>(initialExpenses);

  const value = {
    properties,
    setProperties,
    revenue,
    setRevenue,
    expenses,
    setExpenses,
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
