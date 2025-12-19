'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { GenerateLeaseClauseInput, GenerateLeaseClauseOutput } from '@/lib/types';

const GenerateLeaseClauseInputSchema = z.object({
  description: z.string().describe('A simple description of the rule or clause needed.'),
  context: z.string().optional().describe('Additional context about the lease.'),
});

const GenerateLeaseClauseOutputSchema = z.object({
  clause: z.string().describe('The generated lease clause text.'),
  explanation: z.string().describe('Explanation of the clause.'),
});

export async function generateLeaseClause(input: GenerateLeaseClauseInput): Promise<GenerateLeaseClauseOutput> {
  try {
    const response = await leaseClausePrompt(input);
    const data = response as any;
    return {
      clause: data.clause || data.output?.clause || 'Unable to generate clause',
      explanation: data.explanation || data.output?.explanation || 'Unable to generate explanation',
    };
  } catch (error) {
    return {
      clause: 'Error generating lease clause',
      explanation: String(error),
    };
  }
}

const leaseClausePrompt = ai.definePrompt({
  name: 'generateLeaseClause',
  description: 'Generate a legal lease clause based on a description',
  input: {
    schema: GenerateLeaseClauseInputSchema,
  },
  output: {
    schema: GenerateLeaseClauseOutputSchema,
  },
});

const generateLeaseClauseFlow = ai.defineFlow(
  {
    name: 'generateLeaseClauseFlow',
    inputSchema: GenerateLeaseClauseInputSchema,
    outputSchema: GenerateLeaseClauseOutputSchema,
  },
  async (input): Promise<GenerateLeaseClauseOutput> => {
    const response = await generateLeaseClause(input);
    return response;
  }
);
