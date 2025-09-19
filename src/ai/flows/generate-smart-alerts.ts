'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating smart alerts for property managers.
 *
 * The flow analyzes ERP dashboard data and online sources to proactively identify potential
 * maintenance issues, payment arrears, and other relevant insights, so property managers can
 * plan ahead and mitigate risks.
 *
 * @interface GenerateSmartAlertsInput - Defines the input schema for the flow.
 * @interface GenerateSmart-AlertsOutput - Defines the output schema for the flow.
 * @function generateSmartAlerts - The main function that triggers the smart alert generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const GenerateSmartAlertsInputSchema = z.object({
  dashboardData: z.string().describe('JSON string of ERP dashboard data including property value, revenue, expenses, arrears, and profit.'),
  weatherData: z.string().describe('JSON string of current weather data for the properties.'),
  calendarEvents: z.string().describe('JSON string of upcoming calendar events including property appointments, tenancy start and end dates.'),
});

export type GenerateSmartAlertsInput = z.infer<typeof GenerateSmartAlertsInputSchema>;

// Define the output schema
const GenerateSmartAlertsOutputSchema = z.object({
  alerts: z.array(
    z.object({
      message: z.string().describe('A detailed alert message for the property manager.'),
      severity: z.enum(['high', 'medium', 'low']).describe('The severity of the alert.'),
      propertyAddress: z.string().describe('The address of the property the alert is related to.'),
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

  Dashboard Data: {{{dashboardData}}}
  Weather Data: {{{weatherData}}}
  Calendar Events: {{{calendarEvents}}}

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
