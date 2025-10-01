
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
  prompt: `You are a professional financial analyst AI with expertise in Kenyan real estate accounting. Your task is to generate a comprehensive Profit and Loss (P&L) Statement for {{companyName}} for the period from {{startDate}} to {{endDate}}.

**IMPORTANT:**
- The final output must be a single, clean string formatted in Markdown.
- All financial figures must be presented in the specified currency: **{{currency}}**.
- Follow the Pyramid Principle: start with the conclusion (Executive Summary), then provide supporting details.
- Ensure there is clear spacing (double newlines) between all sections and paragraphs for readability.

**Data for the Period:**
- Revenue Transactions (JSON): {{{revenueTransactions}}}
- Expense Transactions (JSON): {{{expenseTransactions}}}

---

# **Profit & Loss Statement**
### **{{companyName}}**
**For the period:** {{startDate}} to {{endDate}}

---

## **1. Executive Summary**

Provide a brief, insightful narrative (2-3 sentences) on the overall financial performance. Start with the most important figure, the Net Profit/Loss After Tax. Comment on the significance of any credit losses or major expense categories. 

Crucially, include a disclaimer stating that the tax calculation is an estimate for planning purposes and a certified accountant should be consulted for official KRA filing.

---

## **2. Detailed Financial Breakdown**

### **Income**

- **Gross Potential Income:** [Calculate by summing the 'amount' field from all revenue transactions. This represents the total rent due.]
- **Less: Vacancy & Credit Losses:** [Calculate by summing the difference between 'amount' and 'amountPaid' for all revenue transactions where 'amountPaid' is less than 'amount'.]
- **Net Rental Income (Effective Gross Income):** **[This is the total of the 'amountPaid' field from all revenue transactions. Use this as the basis for income calculations.]**

### **Operating Expenses**

List and sum all operating expenses, grouped by category.

- **Maintenance & Repairs:** [Sum of all expenses in 'Maintenance' and 'Repairs' categories.]
- **Property Management Fees:** [Sum of all expenses in 'Management Fees' category.]
- **Insurance:** [Sum of all expenses in 'Insurance' category.]
- **Utilities:** [Sum of all expenses in 'Utilities' category.]
- **Legal & Professional Fees:** [Sum of all expenses in 'Legal Fees' category.]
- *[Add other categories as found in the data...]*

**Total Operating Expenses:** **[Sum of all expense categories.]**

### **Net Operating Income (NOI)**

Calculate the Net Operating Income by subtracting Total Operating Expenses from the Net Rental Income. This is a key indicator of profitability before financing and taxes.

- **Net Operating Income:** **[Net Rental Income - Total Operating Expenses]**

### **Tax Calculation (Estimation Only)**

Based on KRA guidelines for residential rental income, calculate the estimated tax. Assume the Monthly Rental Income (MRI) tax rate of 7.5% applies to the **Net Rental Income (Effective Gross Income)**. State this assumption clearly.

- **Estimated Rental Income Tax (7.5% of Net Rental Income):** [Calculate as Net Rental Income * 0.075]

### **Net Profit / Loss After Tax**

Calculate the final Net Profit or Loss by subtracting the estimated tax from the Net Operating Income.

- **Net Profit / Loss After Tax:** **[Net Operating Income - Estimated Rental Income Tax]**
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
