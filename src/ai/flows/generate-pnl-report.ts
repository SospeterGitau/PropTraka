
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a comprehensive Profit and Loss (P&L) report.
 * The flow accepts financial data for a specified date range and structures the output
 * according to standard accounting principles, including Gross Income, Operating Expenses,
 * Net Operating Income (NOI), and Net Profit.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { GeneratePnlReportInput, GeneratePnlReportOutput, ResidencyStatus } from '@/lib/types';

// Define the input schema for the P&L report
const GeneratePnlReportInputSchema = z.object({
  startDate: z.string().describe('The start date for the report period (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the report period (YYYY-MM-DD).'),
  revenueTransactions: z.string().describe('A JSON string representing an array of revenue transactions. Each transaction must include a `propertyType` of "Domestic" or "Commercial". "amount" is the rent due, "amountPaid" is the rent collected.'),
  expenseTransactions: z.string().describe('A JSON string representing an array of expense transactions.'),
  currency: z.string().describe('The currency code (e.g., USD, GBP, EUR) to use for all financial figures in the report.'),
  companyName: z.string().optional().describe('The name of the company for which the report is being generated.'),
  residencyStatus: z.enum(['resident', 'non-resident']).describe('The residency status of the landlord.'),
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
  prompt: `You are an expert financial analyst AI specialising in Kenyan real estate accounting. Your primary task is to generate a professional, well-structured Profit and Loss (P&L) Statement for {{companyName}} covering the period from {{startDate}} to {{endDate}}.

**Critical Tax Rules:**
- The landlord's residency status is: **{{residencyStatus}}**.
- The Monthly Rental Income (MRI) tax of 7.5% applies ONLY to **resident** landlords.
- MRI tax is calculated ONLY on the gross rent from **"Domestic"** (i.e., residential) properties.
- Income from "Commercial" properties is exempt from this 7.5% MRI tax.
- For non-resident landlords, NO MRI tax should be calculated or applied.

**Formatting Rules (MANDATORY):**
- The entire output MUST be a single string formatted in clean, readable Markdown.
- CRITICAL: You MUST use double newlines ('\n\n') between all sections, paragraphs, and list items to ensure proper spacing and readability. Failure to do so results in an unreadable report.
- All financial figures must be presented in the specified currency: **{{currency}}**.
- Use Markdown headings (#, ##, ###) for structure.
- Use bolding (**) for all calculated totals (e.g., **Total Operating Expenses**).

**Pyramid Principle Structure:**
Your report must follow the Pyramid Principle. Start with the main conclusion (the Executive Summary), then provide the detailed supporting data.

**Data for the Period:**
- Revenue Transactions (JSON): {{{revenueTransactions}}}
- Expense Transactions (JSON): {{{expenseTransactions}}}

---

# **Profit & Loss Statement**

### **{{companyName}}**

**For the period:** {{startDate}} to {{endDate}}

---

## **1. Executive Summary**

(Provide a brief, insightful narrative of 2-3 sentences on the overall financial performance for the period. Start with the most important figure, the Net Profit/Loss After Tax. Comment on the significance of any credit losses or major expense categories. Crucially, if tax was applied, include a disclaimer stating that the tax calculation is an estimate for planning purposes based on KRA's MRI rules for resident landlords and a certified accountant should be consulted for official filing. If no tax was applied due to residency status or property type, state that.)

---

## **2. Detailed Financial Breakdown**

### **Income**

- **Gross Potential Income:** [Calculate by summing the 'amount' field from all revenue transactions. This represents the total rent due for the period.]

- **Less: Vacancy & Credit Losses:** [Calculate by summing the difference between 'amount' and 'amountPaid' for all revenue transactions where 'amountPaid' is less than 'amount'.]

- **Net Rental Income (Effective Gross Income):** **[This is the total of the 'amountPaid' field from all revenue transactions. This is the actual income collected and the basis for all subsequent calculations.]**

\n\n

### **Operating Expenses**

(List and sum all operating expenses from the data, grouped by category.)

- **Maintenance & Repairs:** [Sum of all expenses in 'Maintenance' and 'Repairs' categories.]

- **Property Management Fees:** [Sum of all expenses in 'Management Fees' category.]

- **Insurance:** [Sum of all expenses in 'Insurance' category.]

- **Utilities:** [Sum of all expenses in 'Utilities' category.]

- **Legal & Professional Fees:** [Sum of all expenses in 'Legal Fees' category.]

- *[Add other expense categories as found in the data, listing each on a new line.]*

**Total Operating Expenses:** **[Sum of all individual expense categories.]**

\n\n

### **Net Operating Income (NOI)**

(Calculate the Net Operating Income by subtracting Total Operating Expenses from the Net Rental Income. This is a key indicator of profitability before financing and taxes.)

- **Net Operating Income:** **[Net Rental Income - Total Operating Expenses]**

\n\n

### **Tax Calculation (Estimation Only)**

{{#if (eq residencyStatus "resident")}}
(Based on KRA guidelines for residential rental income, calculate the estimated tax. You MUST state the assumption that you are using the Monthly Rental Income (MRI) tax rate of 7.5% and applying it ONLY to the gross **Net Rental Income** from **"Domestic"** properties for the period.)

- **Gross Residential Rental Income:** [Sum of 'amountPaid' from all revenue transactions where propertyType is 'Domestic'.]

- **Estimated Rental Income Tax (7.5% of Gross Residential Rental Income):** [Calculate as Gross Residential Rental Income * 0.075]
{{else}}
(As a non-resident landlord, no Monthly Rental Income (MRI) tax is applicable. The Net Profit/Loss will be the same as the Net Operating Income.)

- **Estimated Rental Income Tax:** **{{currency}} 0**
{{/if}}

\n\n

### **Net Profit / Loss After Tax**

(Calculate the final Net Profit or Loss. This is the final "bottom line".)

- **Net Profit / Loss After Tax:** **[Net Rental Income - Total Operating Expenses - Estimated Rental Income Tax]**
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

