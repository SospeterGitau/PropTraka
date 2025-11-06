
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a detailed market research analysis.
 * The flow takes a user's rental property portfolio and uses an AI model to generate a
 * competitive analysis report against current market rates.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { GenerateMarketResearchInput, GenerateMarketResearchOutput } from '@/lib/types';

// Define the input schema for the market research analysis
const GenerateMarketResearchInputSchema = z.object({
  properties: z.string().describe('A JSON string representing an array of the user\'s rental properties.'),
  currency: z.string().describe('The currency code (e.g., USD, KES, GBP) for all rental values.'),
  prompt: z.string().describe('The user-editable prompt template for the analysis.'),
});

// Define the output schema for the generated analysis report
const GenerateMarketResearchOutputSchema = z.object({
  report: z.string().describe('The full, formatted market research report as a single string.'),
});

// Define the main function that triggers the flow
export async function generateMarketResearch(input: GenerateMarketResearchInput): Promise<GenerateMarketResearchOutput> {
  return generateMarketResearchFlow(input);
}

// Define the flow
const generateMarketResearchFlow = ai.defineFlow({
  name: 'generateMarketResearchFlow',
  inputSchema: GenerateMarketResearchInputSchema,
  outputSchema: z.object({
    report: z.string().nullable(),
    error: z.string().nullable().optional(),
    hint: z.string().nullable().optional(),
  }),
}, async (input) => {

    const marketResearchPrompt = ai.definePrompt({
        name: 'marketResearchPrompt_dynamic',
        input: { schema: GenerateMarketResearchInputSchema },
        output: { schema: GenerateMarketResearchOutputSchema },
        prompt: input.prompt,
    });

  const { output } = await marketResearchPrompt(input);
  return { report: output!.report };
});
