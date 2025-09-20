
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a comprehensive Profit and Loss (P&L) report.
 * The flow accepts financial data for a specified date range and structures the output
 * according to the pyramid principle, starting with a summary and progressively detailing
 * revenue, expenses, and key insights.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the P&L report
const GeneratePnlReportInputSchema = z.object({
  startDate: z.string().describe('The start date for the report period (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the report period (YYYY-MM-DD).'),
  revenueTransactions: z.string().describe('A JSON string representing an array of revenue transactions.'),
  expenseTransactions: z.string().describe('A JSON string representing an array of expense transactions.'),
});
export type GeneratePnlReportInput = z.infer<typeof GeneratePnlReportInputSchema>;

// Define the output schema for the structured report
export type GeneratePnlReportOutput = {
  report: string | null;
  error?: string | null;
  hint?: string | null;
};

const GeneratePnlReportOutputSchema = z.object({
  report: z.string().describe('The full, formatted P&L report as a single string.'),
});

// Define the main function that triggers the flow
export async function generatePnlReport(input: GeneratePnlReportInput): Promise<GeneratePnlReportOutput> {
  return generatePnlReportFlow(input);
}

// Define the prompt
const pnlReportPrompt = ai.definePrompt({
  name: 'pnlReportPrompt',
  input: { schema: GeneratePnlReportInputSchema },
  output: { schema: GeneratePnlReportOutputSchema },
  prompt: `You are a professional financial analyst AI for a property management company. Your task is to generate a comprehensive Profit and Loss (P&L) report for the period from {{startDate}} to {{endDate}}.

The report must be structured using the pyramid principle: start with the answer/summary first, then provide supporting details.

The final output should be a single, well-formatted string, suitable for copying into a document. Use markdown for headings and lists.

Here is the data for the period:
- Revenue Transactions (JSON): {{{revenueTransactions}}}
- Expense Transactions (JSON): {{{expenseTransactions}}}

Please structure the report as follows:

# Profit & Loss Statement: {{startDate}} to {{endDate}}

## 1. Executive Summary
Start with a high-level summary. This is the "answer first" part of the pyramid.
- State the Total Revenue, Total Expenses, and Net Profit (or Loss).
- Provide a brief, insightful narrative (2-3 sentences) on the overall financial performance during this period. Mention any significant trends or standout results.

## 2. Revenue Breakdown
Provide the next layer of detail supporting the summary.
- List each revenue-generating property.
- For each property, show the total revenue generated during the period.
- Calculate and display the sub-total for all revenue.

## 3. Expense Breakdown
Provide the next layer of detail for expenses.
- Group expenses by category (e.g., Maintenance, Repairs, Insurance, Management Fees, etc.).
- For each category, list the individual expense transactions with their amount.
- Calculate and display the sub-total for each category.
- Calculate and display the total for all expenses.

## 4. Key Insights & Observations
This is the final layer of the pyramid, offering deeper analysis.
- Identify the most profitable property and the one with the highest expenses.
- Highlight the largest expense category and comment on its impact.
- Point out any potential areas for cost savings or revenue optimization based on the data provided.
- Conclude with a forward-looking statement.
`,
});

// Define the flow
const generatePnlReportFlow = ai.defineFlow({
  name: 'generatePnlReportFlow',
  inputSchema: GeneratePnlReportInputSchema,
  outputSchema: z.custom<GeneratePnlReportOutput>(),
}, async (input) => {
  const { output } = await pnlReportPrompt(input);
  return { report: output!.report };
});
