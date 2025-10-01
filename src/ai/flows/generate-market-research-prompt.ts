
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
  prompt: `You are an expert real estate market analyst specializing in competitive rental pricing. Your goal is to conduct a deep-dive analysis of the provided rental property portfolio to determine if their current pricing is competitive within their respective local markets.

**Context:**
The user's rental property portfolio data is provided below. This data will serve as the baseline for your analysis. All financial figures, including current rents, market averages, and recommendations, must be presented in {{currency}}.

**User's Property Portfolio:**
{{{properties}}}

**Core Task - For each property provided:**
For each property in the portfolio, perform the following steps:

a) **Location Identification:** 
Accurately identify the city, state/province, and if possible, the specific submarket or neighborhood for each property.

b) **Market Rent Research:** 
Research and determine the current average market rent for comparable properties. 'Comparable' means properties with the same property type (e.g., Domestic, Commercial), building type (e.g., Detached House, Flat, Office), similar number of bedrooms, bathrooms, and size (e.g., sq ft or sq m). Account for general property condition and amenities if sufficient data is available or can be reasonably inferred.

c) **Price Comparison:** 
Directly compare the user's 'currentRent' with the researched market average.

d) **Verdict:** 
Conclude whether the property is 'Competitively Priced', 'Underpriced', or 'Overpriced' based on your comparison.

e) **Recommendation:** 
Provide a specific new rental price recommendation (e.g., '{{currency}} 1950') or a percentage adjustment (e.g., 'Increase by 8%') to align it with competitive market rates. Justify your recommendation briefly.

**Data Sources:**
Utilize robust market data from the last 3-6 months. Prioritize reputable sources such as major national/local property listing websites (e.g., Zillow, Rightmove, Property24, local equivalents), official government housing statistics (e.g., from sources like CBK publications), and reputable real estate market analysis reports. Ensure data recency and reliability.

**Output Format:**
Your final output must be a well-structured report formatted in Markdown. It should commence with a concise **Executive Summary** (following the Pyramid Principle) offering an overview of the portfolio's overall pricing competitiveness and key findings. Following the Executive Summary, provide a detailed, property-by-property breakdown for each item in the provided portfolio. Each property's section should clearly present the location, market rent research findings, comparison, verdict, and recommendation as outlined in the 'Core Task' section.
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
