
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting an expense category.
 * The flow takes a user's description of an expense and uses an AI model
 * to suggest the most appropriate category from a predefined list.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CATEGORIES = [
  'Accounting', 'Insurance', 'Legal Fees', 'Maintenance', 'Management Fees',
  'Marketing', 'Office Supplies', 'Repairs', 'Salaries', 'Subscriptions',
  'Travel', 'Utilities'
];

const CategorizeExpenseInputSchema = z.object({
  description: z.string().describe('A description of the expense to be categorized.'),
});

const CategorizeExpenseOutputSchema = z.object({
  category: z.string().describe(`The suggested category for the expense. Must be one of: ${CATEGORIES.join(', ')}`),
});

export type CategorizeExpenseInput = z.infer<typeof CategorizeExpenseInputSchema>;
export type CategorizeExpenseOutput = z.infer<typeof CategorizeExpenseOutputSchema>;

export async function categorizeExpense(input: CategorizeExpenseInput): Promise<CategorizeExpenseOutput> {
  return categorizeExpenseFlow(input);
}

const categorizeExpensePrompt = ai.definePrompt({
  name: 'categorizeExpensePrompt',
  input: { schema: CategorizeExpenseInputSchema },
  output: { schema: CategorizeExpenseOutputSchema },
  prompt: `You are an expert accounting assistant for a property management app.
Your task is to analyze an expense description and suggest the most logical category for it.

The only valid categories you can choose from are:
${CATEGORIES.map(c => `- ${c}`).join('\n')}

Analyze the following expense description and determine the best category.

Expense Description:
"{{{description}}}"

Return only the most appropriate category from the provided list.
  `,
});

const categorizeExpenseFlow = ai.defineFlow(
  {
    name: 'categorizeExpenseFlow',
    inputSchema: CategorizeExpenseInputSchema,
    outputSchema: CategorizeExpenseOutputSchema,
  },
  async (input) => {
    const { output } = await categorizeExpensePrompt(input);
    return output!;
  }
);
