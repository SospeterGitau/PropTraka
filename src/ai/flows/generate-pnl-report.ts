'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { GeneratePnlReportInput, GeneratePnlReportOutput } from '@/lib/types';

const GeneratePnlReportInputSchema = z.object({
  startDate: z.string().describe('Start date for the P&L report (yyyy-MM-dd format)'),
  endDate: z.string().describe('End date for the P&L report (yyyy-MM-dd format)'),
  revenueTransactions: z.string().describe('JSON stringified array of revenue transactions'),
  expenseTransactions: z.string().describe('JSON stringified array of expense transactions'),
  currency: z.string().describe('Currency code (e.g., KES, USD)'),
  companyName: z.string().describe('Name of the company/landlord'),
  residencyStatus: z.string().describe('Residency status for tax purposes'),
  prompt: z.string().describe('Custom prompt for report generation'),
});

const GeneratePnlReportOutputSchema = z.object({
  report: z.string().nullable().describe('The generated P&L report as text'),
  error: z.string().nullable().optional().describe('Error message if generation failed'),
  hint: z.string().optional().describe('Helpful hint if error occurred'),
});

export async function generatePnlReport(input: GeneratePnlReportInput): Promise<GeneratePnlReportOutput> {
  return generatePnlReportFlow(input);
}

const pnlReportPrompt = ai.definePrompt({
  name: 'generatePnlReportPrompt',
  input: { schema: GeneratePnlReportInputSchema },
  output: { schema: GeneratePnlReportOutputSchema },
  prompt: `You are a professional accountant and financial analyst. Generate a detailed P&L (Profit & Loss) Statement.

Report Period: {{{startDate}}} to {{{endDate}}}
Company: {{{companyName}}}
Currency: {{{currency}}}
Residency Status: {{{residencyStatus}}}

Revenue Transactions:
{{{revenueTransactions}}}

Expense Transactions:
{{{expenseTransactions}}}

Custom Instructions:
{{{prompt}}}

Generate a professional P&L statement with detailed analysis.`,
});

const generatePnlReportFlow = ai.defineFlow(
  {
    name: 'generatePnlReportFlow',
    inputSchema: GeneratePnlReportInputSchema,
    outputSchema: GeneratePnlReportOutputSchema,
  },
  async (input) => {
    const { output } = await pnlReportPrompt(input);
    return output!;
  }
);
