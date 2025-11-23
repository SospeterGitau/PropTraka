
'use server';

/**
 * @fileOverview This file defines a Genkit flow for composing a polite but firm
 * reminder email to a tenant who is in arrears.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { GenerateReminderEmailInput, GenerateReminderEmailOutput } from '@/lib/types';

const GenerateReminderEmailInputSchema = z.object({
  tenantName: z.string().describe('The full name of the tenant.'),
  propertyAddress: z.string().describe('The full address of the property the tenant occupies.'),
  amountOwed: z.string().describe('The total outstanding amount, formatted as a currency string (e.g., "KES 15,000.00").'),
  daysOverdue: z.number().describe('The number of days the earliest unpaid portion of the debt has been overdue.'),
  companyName: z.string().describe('The name of the landlord or property management company sending the reminder.'),
  arrearsBreakdown: z.string().describe('A detailed breakdown of the outstanding charges, including the period for each charge.'),
});

const GenerateReminderEmailOutputSchema = z.object({
  subject: z.string().describe('A clear and professional subject line for the email.'),
  body: z.string().describe('The full, formatted body of the email. It must be polite, clear, and firm. Use newline characters for spacing.'),
});

export async function generateReminderEmail(input: GenerateReminderEmailInput): Promise<GenerateReminderEmailOutput> {
  return generateReminderEmailFlow(input);
}

const reminderEmailPrompt = ai.definePrompt({
  name: 'generateReminderEmailPrompt',
  input: { schema: GenerateReminderEmailInputSchema },
  output: { schema: GenerateReminderEmailOutputSchema },
  prompt: `You are an expert property manager's assistant, skilled in writing clear, polite, and effective tenant communications.

Your task is to compose a rental arrears reminder email. The tone must be professional and firm, like a formal notice from a financial institution.

**Tenant and Arrears Details:**
- Tenant Name: {{{tenantName}}}
- Property: {{{propertyAddress}}}
- Total Amount Owed: {{{amountOwed}}}
- Days Overdue (since first missed payment): {{{daysOverdue}}} days
- Sender Name/Company: {{{companyName}}}

**Arrears Breakdown by Period:**
{{{arrearsBreakdown}}}

**Instructions:**
1.  **Generate a Subject Line:** Create a subject line that is formal and professional. It must include the words "Urgent: Overdue Rent Reminder".
2.  **Generate the Email Body:**
    - Address the tenant formally by name.
    - Politely state that this is a formal notice regarding an outstanding balance on their account.
    - Clearly mention the property address and the total amount owed ({{{amountOwed}}}).
    - **Crucially, include the detailed arrears breakdown provided above to give full transparency on which periods and charges are outstanding.**
    - Instead of a soft request, state clearly that payment is required. Demand that the outstanding balance be settled within 5 business days to bring their account up to date, as per the terms of their tenancy agreement.
    - Include a standard closing line: "If you have already made this payment or believe this notice was sent in error, please contact our office immediately."
    - Offer assistance if they have questions about the balance.
    - Sign off with "Regards," followed by the sender's name/company ({{{companyName}}}).
    - Use double newlines to create paragraphs for readability.
`,
});

const generateReminderEmailFlow = ai.defineFlow(
  {
    name: 'generateReminderEmailFlow',
    inputSchema: GenerateReminderEmailInputSchema,
    outputSchema: GenerateReminderEmailOutputSchema,
  },
  async (input) => {
    const { output } = await reminderEmailPrompt(input);
    return output!;
  }
);
