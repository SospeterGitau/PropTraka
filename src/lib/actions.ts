'use server';

import {generateSmartAlerts, type GenerateSmartAlertsOutput} from '@/ai/flows/generate-smart-alerts';
import {weatherData, calendarEvents} from '@/lib/data';
import type {Property, Transaction} from './types';

interface SmartAlertsData {
  properties: Property[];
  revenue: Transaction[];
  expenses: Transaction[];
}

export async function getSmartAlerts(data: SmartAlertsData): Promise<GenerateSmartAlertsOutput> {
  try {
    const totalArrears = data.revenue
      .filter((r) => {
        const amountDue = r.amount + (r.deposit ?? 0);
        const amountPaid = r.amountPaid ?? 0;
        return amountPaid < amountDue && new Date(r.date) < new Date();
      })
      .reduce((acc, r) => {
        const amountDue = r.amount + (r.deposit ?? 0);
        const amountPaid = r.amountPaid ?? 0;
        return acc + (amountDue - amountPaid);
      }, 0);

    const dashboardData = {
      totalPropertyValue: data.properties.reduce((acc, p) => acc + p.currentValue, 0),
      totalRevenue: data.revenue
        .filter((r) => new Date(r.date).getMonth() === new Date().getMonth())
        .reduce((acc, r) => acc + (r.amountPaid ?? 0), 0),
      totalExpenses: data.expenses
        .filter((e) => new Date(e.date).getMonth() === new Date().getMonth())
        .reduce((acc, e) => acc + e.amount, 0),
      totalArrears: totalArrears,
      totalProfit: 0,
    };
    dashboardData.totalProfit = dashboardData.totalRevenue - dashboardData.totalExpenses;

    const alerts = await generateSmartAlerts({
      dashboardData: dashboardData,
      weatherData: weatherData,
      calendarEvents: calendarEvents,
    });
    return alerts;
  } catch (error) {
    console.error('Error generating smart alerts:', error);
    // Return a structured error if you want to handle it on the client
    return {
      alerts: [
        {
          message: 'Failed to generate smart alerts. Please try again later.',
          severity: 'high',
          propertyAddress: 'System',
        },
      ],
    };
  }
}
