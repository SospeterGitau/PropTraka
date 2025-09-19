'use server';

import {generateSmartAlerts, type GenerateSmartAlertsOutput} from '@/ai/flows/generate-smart-alerts';
import {weatherData, calendarEvents} from '@/lib/data';
import type {Property, Transaction} from './types';
import { format } from 'date-fns';

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

    // Create a plain text summary for the AI
    const summary = `
- Dashboard Data:
  - Total Property Value: $${dashboardData.totalPropertyValue.toLocaleString()}
  - Total Revenue this month: $${dashboardData.totalRevenue.toLocaleString()}
  - Total Expenses this month: $${dashboardData.totalExpenses.toLocaleString()}
  - Total Arrears: $${dashboardData.totalArrears.toLocaleString()}
  - Total Profit this month: $${dashboardData.totalProfit.toLocaleString()}

- Weather Data for ${weatherData.city}:
  - Current Temperature: ${weatherData.temperature}
  - Current Condition: ${weatherData.condition}
  - Forecast:
    ${weatherData.forecast.map(f => `- ${f.day}: ${f.condition}, ${f.temp}${f.precipitation_chance ? ` (${f.precipitation_chance} chance of precipitation)` : ''}`).join('\n    ')}

- Upcoming Calendar Events:
  ${calendarEvents.map(e => `- ${format(new Date(e.date), 'MMMM dd, yyyy')}: ${e.title} (${e.type})`).join('\n  ')}
`;

    const alerts = await generateSmartAlerts({ summary });
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
