'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { GenerateMarketResearchInput, GenerateMarketResearchOutput } from '@/lib/types';

const GenerateMarketResearchInputSchema = z.object({
  properties_data: z.string().describe('JSON stringified array of property data for analysis'),
  currency: z.string().describe('Currency code (e.g., KES, USD, EUR)'),
  prompt: z.string().describe('Custom prompt for market research analysis'),
});

const GenerateMarketResearchOutputSchema = z.object({
  report: z.string().nullable().describe('The generated market research report'),
  error: z.string().nullable().optional().describe('Error message if generation failed'),
  hint: z.string().optional().describe('Helpful hint if error occurred'),
});

export async function generateMarketResearch(input: GenerateMarketResearchInput): Promise<GenerateMarketResearchOutput> {
  return generateMarketResearchFlow(input);
}

const marketResearchPrompt = ai.definePrompt({
  name: 'generateMarketResearchPrompt',
  input: { schema: GenerateMarketResearchInputSchema },
  output: { schema: GenerateMarketResearchOutputSchema },
  prompt: `You are a real estate market analysis expert. Analyze the following property data and market conditions.

Currency: {{{currency}}}

Property Data:
{{{properties_data}}}

Custom Analysis Request:
{{{prompt}}}

Provide a comprehensive market analysis and recommendations.`,
});

const generateMarketResearchFlow = ai.defineFlow(
  {
    name: 'generateMarketResearchFlow',
    inputSchema: GenerateMarketResearchInputSchema,
    outputSchema: GenerateMarketResearchOutputSchema,
  },
  async (input) => {
    const { output } = await marketResearchPrompt(input);
    return output!;
  }
);
