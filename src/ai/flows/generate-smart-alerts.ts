'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating smart alerts for property managers.
 *
 * The flow analyzes ERP dashboard data and online sources to proactively identify potential
 * maintenance issues, payment arrears, and other relevant insights, so property managers can
 * plan ahead and mitigate risks.
 *
 * @interface GenerateSmartAlertsInput - Defines the input schema for the flow.
 * @interface GenerateSmartAlertsOutput - Defines the output schema for the flow.
 * @function generateSmartAlerts - The main function that triggers the smart alert generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define a more detailed schema for the input data
const DashboardDataSchema = z.object({
  totalPropertyValue: z.number(),
  totalRevenue: z.number(),
  totalExpenses: z.number(),
  totalArrears: z.number(),
  totalProfit: z.number(),
});

const WeatherDataSchema = z.object({
  city: z.string(),
  temperature: z.string(),
  condition: z.string(),
  forecast: z.array(z.object({
    day: z.string(),
    condition: z.string(),
    temp: z.string(),
    precipitation_chance: z.string().optional(),
  })),
});

const CalendarEventSchema = z.object({
  date: z.string(),
  title: z.string(),
  type: z.enum(['appointment', 'tenancy-start', 'tenancy-end']),
});


// Define the input schema using the detailed schemas
const GenerateSmartAlertsInputSchema = z.object({
  dashboardData: DashboardDataSchema,
  weatherData: WeatherDataSchema,
  calendarEvents: z.array(CalendarEventSchema),
});

export type GenerateSmartAlertsInput = z.infer<typeof GenerateSmartAlertsInputSchema>;

// Define the output schema
const GenerateSmartAlertsOutputSchema = z.object({
  alerts: z.array(
    z.object({
      message: z.string().describe('A detailed alert message for the property manager.'),
      severity: z.enum(['high', 'medium', 'low']).describe('The severity of the alert.'),
      propertyAddress: z.string().describe('The address of the property the alert is related to, or "System" if it is a general alert.'),
    })
  ).describe('An array of smart alerts.'),
});

export type GenerateSmartAlertsOutput = z.infer<typeof GenerateSmartAlertsOutputSchema>;

// Define the main function that triggers the flow
export async function generateSmartAlerts(input: GenerateSmartAlertsInput): Promise<GenerateSmartAlertsOutput> {
  return generateSmartAlertsFlow(input);
}

// Define the prompt
const smartAlertsPrompt = ai.definePrompt({
  name: 'smartAlertsPrompt',
  input: {
    schema: GenerateSmartAlertsInputSchema,
  },
  output: {
    schema: GenerateSmartAlertsOutputSchema,
  },
  prompt: `You are an AI assistant designed to analyze property management data and generate smart alerts for property managers.

  Analyze the following data to identify potential maintenance issues, payment arrears, and other relevant insights. Provide specific and actionable alerts with severity levels (high, medium, low).

  Dashboard Data:
  - Total Property Value: {{dashboardData.totalPropertyValue}}
  - Total Revenue this month: {{dashboardData.totalRevenue}}
  - Total Expenses this month: {{dashboardData.totalExpenses}}
  - Total Arrears: {{dashboardData.totalArrears}}
  - Total Profit this month: {{dashboardData.totalProfit}}

  Weather Data for {{weatherData.city}}:
  - Current Temperature: {{weatherData.temperature}}
  - Current Condition: {{weatherData.condition}}
  - Forecast:
    {{#each weatherData.forecast}}
    - {{day}}: {{condition}}, {{temp}}{{#if precipitation_chance}} ({{precipitation_chance}} chance of precipitation){{/if}}
    {{/each}}
  
  Upcoming Calendar Events:
  {{#each calendarEvents}}
  - {{date}}: {{title}} ({{type}})
  {{/each}}

  Based on all this information, generate a list of alerts. For example, if there is a storm forecast, suggest checking properties for potential damage. If arrears are high, suggest sending reminders.
  
  Format your response as a JSON array of alerts, each including a message, severity, and the related property address.
  `,
});

// Define the flow
const generateSmartAlertsFlow = ai.defineFlow({
  name: 'generateSmartAlertsFlow',
  inputSchema: GenerateSmartAlertsInputSchema,
  outputSchema: GenerateSmartAlertsOutputSchema,
}, async (input) => {
  const {output} = await smartAlertsPrompt(input);
  return output!;
});
