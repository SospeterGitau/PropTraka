
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a formal
 * legal clause for a tenancy agreement based on a simple description.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { GenerateLeaseClauseInput, GenerateLeaseClauseOutput } from '@/lib/types';

const GenerateLeaseClauseInputSchema = z.object({
  description: z.string().describe('A simple description of the rule or clause needed.'),
});

const GenerateLeaseClauseOutputSchema = z.object({
  clause: z.string().describe('The professionally drafted, legally-sound lease clause.'),
});

export async function generateLeaseClause(input: GenerateLeaseClauseInput): Promise<GenerateLeaseClauseOutput> {
  return generateLeaseClauseFlow(input);
}

const leaseClausePrompt = ai.definePrompt({
  name: 'generateLeaseClausePrompt',
  input: { schema: GenerateLeaseClauseInputSchema },
  output: { schema: GenerateLeaseClauseOutputSchema },
  prompt: `You are an expert paralegal specializing in Kenyan property law. Your task is to draft a clear, formal, and legally-sound tenancy agreement clause based on a simple description.

The clause must be unambiguous and suitable for inclusion in a formal lease document.

**User's Description of Required Clause:**
"{{{description}}}"

**Instructions:**
1.  Analyze the user's description.
2.  Draft a comprehensive and professional lease clause that accurately reflects the user's intent.
3.  Ensure the language is formal and appropriate for a legal contract in Kenya.
4.  The output must only contain the text of the clause itself. Do not add any introductory phrases like "Here is the clause:".
`,
});

const generateLeaseClauseFlow = ai.defineFlow(
  {
    name: 'generateLeaseClauseFlow',
    inputSchema: GenerateLeaseClauseInputSchema,
    outputSchema: GenerateLeaseClauseOutputSchema,
  },
  async (input) => {
    const { output } = await leaseClausePrompt(input);
    return output!;
  }
);
