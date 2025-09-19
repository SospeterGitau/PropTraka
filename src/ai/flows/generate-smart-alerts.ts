'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating smart alerts for property managers.
 *
 * The flow takes a pre-formatted summary of data and uses it to generate creative and
 * actionable alerts.
 *
 * @interface GenerateSmartAlertsInput - Defines the input schema for the flow.
 * @interface GenerateSmartAlertsOutput - Defines the output schema for the flow.
 * @function generateSmartAlerts - The main function that triggers the smart alert generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for a simple summary string
const GenerateSmartAlertsInputSchema = z.object({
  summary: z.string().describe('A plain text summary of all relevant data.'),
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
  prompt: `You are an AI assistant designed to generate smart alerts for property managers based on a data summary.
  
  Analyze the following summary to identify potential maintenance issues, payment arrears, and other relevant insights. 
  Provide specific and actionable alerts with severity levels (high, medium, low).

  Data Summary:
  {{{summary}}}

  Based on this summary, generate a list of alerts. For example, if there is a storm forecast, suggest checking properties for potential damage. If arrears are high, suggest sending reminders.
  
  Format your response as a JSON array of alerts, each including a message, severity, and the related property address. If an alert is not for a specific property, use "System".
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
