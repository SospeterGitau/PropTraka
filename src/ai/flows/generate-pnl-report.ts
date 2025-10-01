
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
  currency: z.string().describe('The currency code (e.g., USD, GBP, EUR) to use for all financial figures in the report.'),
  companyName: z.string().optional().describe('The name of the company for which the report is being generated.'),
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

// Define the prompt
const pnlReportPrompt = ai.definePrompt({
  name: 'pnlReportPrompt',
  input: { schema: GeneratePnlReportInputSchema },
  output: { schema: GeneratePnlReportOutputSchema },
  prompt: `You are a professional financial analyst AI. Your task is to generate a comprehensive Profit and Loss (P&L) Statement suitable for presentation to banks, financial institutions, or investors for {{companyName}} for the period from {{startDate}} to {{endDate}}.

IMPORTANT: The final output must be a single, clean string. Do not include any extraneous text or formatting outside of the report itself.
IMPORTANT: All financial figures in the final report must be formatted using the specified currency: {{currency}}.

The report must be structured according to the Pyramid Principle: start with the conclusion (Executive Summary) first, followed by the supporting details. Use markdown for headings, bold for totals, and lists where appropriate.

Here is the data for the period:
- Revenue Transactions (JSON): {{{revenueTransactions}}}
- Expense Transactions (JSON): {{{expenseTransactions}}}

Please structure the report as follows:

# Profit & Loss Statement
## {{companyName}}
For the period: {{startDate}} to {{endDate}}

## 1. Executive Summary
Provide a brief, insightful narrative (2-3 sentences) on the overall financial performance during this period. Start with the most important figure, the Net Operating Income. Comment on the significance of any credit losses or major expense categories and what they imply for the business's health and investment potential.

## 2. Detailed Financial Breakdown

### Income
Calculate the Gross Potential Income by summing the 'amount' and 'deposit' fields from all revenue transactions. This represents the total possible income.
Calculate Vacancy & Credit Losses by finding the difference between the Gross Potential Income and the total amount paid ('amountPaid'). This shows revenue lost due to non-payment.
Calculate the Net Rental Income (also known as Effective Gross Income) by subtracting Vacancy & Credit Losses from the Gross Potential Income.

- **Gross Potential Income:** [Total of all 'amount' + 'deposit' fields]
- **Less: Vacancy & Credit Losses:** [Gross Potential Income - Total of all 'amountPaid' fields]
- **Net Rental Income:** [Gross Potential Income - Vacancy & Credit Losses]

### Operating Expenses
List and sum all operating expenses, grouped by category (e.g., Maintenance, Repairs, Insurance, Management Fees, Utilities, etc.).

- **Maintenance & Repairs:** [Sum of all expenses in 'Maintenance' and 'Repairs' categories]
- **Property Management Fees:** [Sum of all expenses in 'Management Fees' category]
- **Insurance:** [Sum of all expenses in 'Insurance' category]
- **Utilities:** [Sum of all expenses in 'Utilities' category]
- **Legal & Professional Fees:** [Sum of all expenses in 'Legal Fees' category]
- [Add other categories as found in the data]
- **Total Operating Expenses:** [Sum of all expense categories]

### Net Operating Income (NOI)
Calculate the Net Operating Income by subtracting Total Operating Expenses from the Net Rental Income. This is a key indicator of the property portfolio's profitability from its core operations, before financing and taxes.

- **Net Operating Income:** [Net Rental Income - Total Operating Expenses]

### Net Profit / Loss
For this report, since we are not including non-operating items like mortgage interest, depreciation, or taxes, the Net Profit will be the same as the Net Operating Income. State this clearly for transparency.

- **Net Profit / Loss:** [Value from Net Operating Income]
`,
});

// Define the flow
const generatePnlReportFlow = ai.defineFlow({
  name: 'generatePnlReportFlow',
  inputSchema: GeneratePnlReportInputSchema,
  outputSchema: PnlReportFlowOutputSchema,
}, async (input) => {
  const { output } = await pnlReportPrompt(input);
  return { report: output!.report };
});
