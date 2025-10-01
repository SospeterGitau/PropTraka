
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a detailed market research prompt.
 * The prompt is designed to be used with an advanced AI model to analyze the competitiveness
 * of a user's rental property portfolio against current market rates.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { GenerateMarketResearchPromptInput, GenerateMarketResearchPromptOutput } from '@/lib/types';

// Define the input schema for the market research prompt generation
const GenerateMarketResearchPromptInputSchema = z.object({
  properties: z.string().describe('A JSON string representing an array of the user\'s rental properties.'),
  currency: z.string().describe('The currency code (e.g., USD, KES, GBP) for all rental values.'),
});

// Define the output schema for the generated prompt
const GenerateMarketResearchPromptOutputSchema = z.object({
  prompt: z.string().describe('The generated, detailed market research prompt.'),
});

// Define the main function that triggers the flow
export async function generateMarketResearchPrompt(input: GenerateMarketResearchPromptInput): Promise<GenerateMarketResearchPromptOutput> {
  return generateMarketResearchPromptFlow(input);
}

// Define the prompt template for generating the research prompt
const researchPromptGenerator = ai.definePrompt({
  name: 'researchPromptGenerator',
  input: { schema: GenerateMarketResearchPromptInputSchema },
  output: { schema: GenerateMarketResearchPromptOutputSchema },
  prompt: `You are an expert real estate market analyst AI. Your task is to generate a comprehensive, structured research prompt for another AI model. This prompt will be used to conduct a deep-dive analysis of a user's rental property portfolio to determine if their pricing is competitive.

The user has provided their property data in JSON format. Use this data to construct the final research prompt.

User's Property Portfolio (JSON):
{{{properties}}}

User's Currency: {{currency}}

Generate a research prompt that includes the following sections:

1.  **Role and Goal:** Instruct the AI to act as an expert real estate analyst for a specific geographic area. The goal is to provide a competitive analysis of the user's rental prices.

2.  **Context:** State that the user's portfolio data is provided and should be used as the basis for comparison. Mention the currency to be used for all financial figures.

3.  **Core Task - For each property provided:**
    *   Identify the city and specific submarket/neighborhood.
    *   Research the current average market rent for similar properties (same type, size, bedroom/bathroom count).
    *   Provide a direct comparison between the user's current rent and the market average.
    *   Conclude with a "Verdict": Is the property priced competitively, underpriced, or overpriced?
    *   Provide a "Recommendation": Suggest a specific new rental price or a percentage adjustment.

4.  **Data Sources:** Instruct the AI to use data from the last 3-6 months from reputable sources like major property listing websites (e.g., Zillow, Rightmove, Property24), official government statistics, and established real estate market analysis reports.

5.  **Output Format:** Specify that the final output should be a clean, well-structured report using Markdown for formatting. It should start with a high-level executive summary and then provide a detailed, property-by-property breakdown.

Combine all of these instructions into a single, cohesive, and powerful prompt. The generated prompt should be the only thing in your output.
`,
});

// Define the flow
const generateMarketResearchPromptFlow = ai.defineFlow({
  name: 'generateMarketResearchPromptFlow',
  inputSchema: GenerateMarketResearchPromptInputSchema,
  outputSchema: GenerateMarketResearchPromptOutputSchema,
}, async (input) => {
  const { output } = await researchPromptGenerator(input);
  return output!;
});
