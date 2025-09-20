
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a comprehensive Profit and Loss (P&L) report.
 * The flow accepts financial data for a specified date range and structures the output
 * according to standard accounting principles, including Gross Income, Operating Expenses,
 * Net Operating Income (NOI), and Net Profit.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GeneratePnlReportInput, GeneratePnlReportOutput } from '@/lib/types';

// Define the input schema for the P&L report
const GeneratePnlReportInputSchema = z.object({
  startDate: z.string().describe('The start date for the report period (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the report period (YYYY-MM-DD).'),
  revenueTransactions: z.string().describe('A JSON string representing an array of revenue transactions. "amount" is the rent due, "amountPaid" is the rent collected.'),
  expenseTransactions: z.string().describe('A JSON string representing an array of expense transactions.'),
});

// Define the output schema for the structured report
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
  prompt: `You are a professional financial analyst AI for a property management company. Your task is to generate a comprehensive Profit and Loss (P&L) Statement for the period from {{startDate}} to {{endDate}}.

The report must be structured according to standard accounting principles. The final output should be a single, well-formatted string, suitable for copying into a document. Use markdown for headings, bold for totals, and lists where appropriate.

Here is the data for the period:
- Revenue Transactions (JSON): {{{revenueTransactions}}}
- Expense Transactions (JSON): {{{expenseTransactions}}}

Please structure the report as follows:

# Profit & Loss Statement
For the period: {{startDate}} to {{endDate}}

## 1. Income
Calculate the Gross Rental Income by summing the 'amount' and 'deposit' from all revenue transactions.
Calculate Vacancy & Credit Losses by finding the difference between the total amount due (amount + deposit) and the total amount paid ('amountPaid').
Calculate the Net Rental Income by subtracting Vacancy & Credit Losses from the Gross Rental Income.

- **Gross Rental Income:** [Total of all 'amount' + 'deposit' fields]
- **Less: Vacancy & Credit Losses:** [Total Due - Total Paid]
- **Net Rental Income:** [Gross Rental Income - Vacancy & Credit Losses]

## 2. Operating Expenses
List and sum all operating expenses, grouped by category (e.g., Maintenance, Repairs, Insurance, Management Fees, Utilities, etc.).

- **Maintenance & Repairs:** [Sum of maintenance & repairs]
- **Property Management Fees:** [Sum of management fees]
- **Insurance:** [Sum of insurance costs]
- **Utilities:** [Sum of utilities]
- **Legal & Professional Fees:** [Sum of legal fees]
- [Add other categories as found in the data]
- **Total Operating Expenses:** [Sum of all expense categories]

## 3. Net Operating Income (NOI)
Calculate the Net Operating Income by subtracting Total Operating Expenses from the Net Rental Income. This is a key indicator of the property portfolio's profitability from its core operations.

- **Net Operating Income:** [Net Rental Income - Total Operating Expenses]

## 4. Net Profit / Loss
For this report, since we are not including non-operating items like mortgage interest, depreciation, or taxes, the Net Profit will be the same as the Net Operating Income. State this clearly.

- **Net Profit / Loss:** [Value from Net Operating Income]

## 5. Executive Summary
Provide a brief, insightful narrative (2-3 sentences) on the overall financial performance during this period. Mention the Net Operating Income and comment on the significance of any credit losses or major expense categories.
`,
});

// Define the flow
const generatePnlReportFlow = ai.defineFlow({
  name: 'generatePnlReportFlow',
  inputSchema: GeneratePnlReportInputSchema,
  outputSchema: z.object({
    report: z.string().nullable(),
    error: z.string().nullable().optional(),
    hint: z.string().nullable().optional(),
  }),
}, async (input) => {
  const { output } = await pnlReportPrompt(input);
  return { report: output!.report };
});
