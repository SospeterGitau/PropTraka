'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a narrative summary of a revenue report.
 *
 * The flow takes a pre-formatted summary of report data and uses it to generate a
 * human-readable analysis.
 *
 * @function generateReportSummary - The main function that triggers the report summary generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { GenerateReportSummaryInput, GenerateReportSummaryOutput } from '@/lib/types';

// Define the input schema for a simple summary string
const GenerateReportSummaryInputSchema = z.object({
  summary: z.string().describe('A plain text summary of all relevant report data.'),
});

// Define the output schema
const GenerateReportSummaryOutputSchema = z.object({
  summary: z.string().describe('A narrative summary of the report.'),
});

// Define the main function that triggers the flow
export async function generateReportSummary(input: GenerateReportSummaryInput): Promise<GenerateReportSummaryOutput> {
  return generateReportSummaryFlow(input);
}

// Define the prompt
const reportSummaryPrompt = ai.definePrompt({
  name: 'reportSummaryPrompt',
  input: {
    schema: GenerateReportSummaryInputSchema,
  },
  output: {
    schema: GenerateReportSummaryOutputSchema,
  },
  prompt: `You are an AI assistant designed to analyse financial data for a property manager and provide a clear, narrative summary.
  
  Analyse the following data summary for the given period. Highlight the key differences between projected and actual revenue, and comment on the significance of any arrears.
  Keep the summary concise and to the point, aiming for 2-3 sentences.

  Data Summary:
  {{{summary}}}
  `,
});

// Define the flow
const generateReportSummaryFlow = ai.defineFlow({
  name: 'generateReportSummaryFlow',
  inputSchema: GenerateReportSummaryInputSchema,
  outputSchema: GenerateReportSummaryOutputSchema,
}, async (input) => {
  const {output} = await reportSummaryPrompt(input);
  return output!;
});
