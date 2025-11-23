
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

Your task is to compose a rental arrears reminder email. The tone should be professional and firm, but not aggressive. Clearly state the problem (the overdue amount) and the desired action (payment).

**Tenant and Arrears Details:**
- Tenant Name: {{{tenantName}}}
- Property: {{{propertyAddress}}}
- Amount Owed: {{{amountOwed}}}
- Days Overdue: {{{daysOverdue}}}
- Sender Name/Company: {{{companyName}}}

**Instructions:**
1.  **Generate a Subject Line:** Create a subject line that is clear and professional. It should include the words "Overdue Rent Reminder".
2.  **Generate the Email Body:**
    - Address the tenant by name.
    - Politely state that this is a reminder regarding an outstanding balance for their tenancy.
    - Clearly mention the property address and the total amount owed ({{{amountOwed}}}).
    - Request that they make the payment at their earliest convenience.
    - Include a standard closing line: "If you have already made this payment, please disregard this notice."
    - Offer assistance if they have questions.
    - Sign off with "Best regards," followed by the sender's name/company ({{{companyName}}}).
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
