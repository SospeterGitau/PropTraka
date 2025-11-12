
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a comprehensive Profit and Loss (P&L) report.
 * The flow accepts financial data for a specified date range and structures the output
 * according to standard accounting principles, including Gross Income, Operating Expenses,
 * Net Operating Income (NOI), and Net Profit.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { GeneratePnlReportInput, GeneratePnlReportOutput } from '@/lib/types';

// Define the input schema for the P&L report
const GeneratePnlReportInputSchema = z.object({
  startDate: z.string().describe('The start date for the report period (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the report period (YYYY-MM-DD).'),
  revenueTransactions: z.string().describe('A JSON string representing an array of revenue transactions. Each transaction must include a `propertyType` of "Domestic" or "Commercial". "amount" is the rent due, "amountPaid" is the rent collected.'),
  expenseTransactions: z.string().describe('A JSON string representing an array of expense transactions.'),
  currency: z.string().describe('The currency code (e.g., USD, GBP, EUR) to use for all financial figures in the report.'),
  companyName: z.string().optional().describe('The name of the company for which the report is being generated.'),
  residencyStatus: z.enum(['resident', 'non-resident']).describe('The residency status of the landlord.'),
  prompt: z.string().describe('The user-editable prompt template.'),
  isResident: z.boolean().describe('True if the landlord is a resident.'),
  isNonResident: z.boolean().describe('True if the landlord is a non-resident.'),
});

// Define the output schema for the structured report
const GeneratePnlReportOutputSchema = z.object({
  report: z.string().describe('The full, formatted P&L report as a single string.'),
});

// Define the main function that triggers the flow
export async function generatePnlReport(input: GeneratePnlReportInput): Promise<GeneratePnlReportOutput> {
  return generatePnlReportFlow(input);
}

const PnlReportFlowOutputSchema = z.object({
  report: z.string().nullable(),
  error: z.string().nullable().optional(),
  hint: z.string().nullable().optional(),
});


// Define the flow
const generatePnlReportFlow = ai.defineFlow({
  name: 'generatePnlReportFlow',
  inputSchema: GeneratePnlReportInputSchema,
  outputSchema: PnlReportFlowOutputSchema,
}, async (input) => {
    // Dynamically define the prompt within the flow
    const pnlReportPrompt = ai.definePrompt({
      name: 'pnlReportPrompt_dynamic',
      input: { schema: GeneratePnlReportInputSchema },
      output: { schema: GeneratePnlReportOutputSchema },
      prompt: input.prompt, // Use the prompt from the input
    });
    
    // Add the boolean flags based on residencyStatus
    const fullInput = {
      ...input,
      isResident: input.residencyStatus === 'resident',
      isNonResident: input.residencyStatus === 'non-resident',
    };

  const { output } = await pnlReportPrompt(fullInput);
  return { report: output!.report };
});

