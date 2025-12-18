'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input Schema
const GenerateHealthInsightsInputSchema = z.object({
    occupancyRate: z.number().describe('The percentage of occupied units (0-100)'),
    totalArrears: z.number().describe('Total amount of arrears in currency'),
    arrearsCount: z.number().describe('Number of tenants/units in arrears'),
    diversityScore: z.number().describe('Calculated diversity score of the portfolio (0-10)'),
    propertyCount: z.number().describe('Total number of properties in the portfolio'),
});

// Output Schema
const GenerateHealthInsightsOutputSchema = z.object({
    criticalActions: z.array(z.string()).describe('List of 2-3 prioritized actions the user should take immediately.'),
    positiveHighlights: z.array(z.string()).describe('List of 2-3 things that are going well in the portfolio.'),
    overallAssessment: z.string().describe('A concise 1-sentence summary of the portfolio health.'),
});

// Prompt Definition
const healthInsightsPrompt = ai.definePrompt({
    name: 'healthInsightsPrompt',
    input: {
        schema: GenerateHealthInsightsInputSchema,
    },
    output: {
        schema: GenerateHealthInsightsOutputSchema,
    },
    prompt: `You are an expert property manager and financial analyst. 
  
  Analyze the following portfolio health metrics:
  - Occupancy Rate: {{occupancyRate}}%
  - Total Arrears: {{totalArrears}}
  - Tenants in Arrears: {{arrearsCount}}
  - Diversity Score: {{diversityScore}}/10
  - Total Properties: {{propertyCount}}

  Provide a professional assessment.
  - Critical Actions: Suggest specific steps to address any weaknesses (e.g., low occupancy, high arrears). If everything is perfect, suggest optimization strategies (e.g., reviewing rent prices).
  - Positive Highlights: Call out what is performing well.
  - Overall Assessment: one short, punchy sentence summarizing the state of the portfolio.
  
  Tone: Professional, encouraging, and action-oriented.
  `,
});

// Flow Definition
const generateHealthInsightsFlow = ai.defineFlow({
    name: 'generateHealthInsightsFlow',
    inputSchema: GenerateHealthInsightsInputSchema,
    outputSchema: GenerateHealthInsightsOutputSchema,
}, async (input) => {
    const { output } = await healthInsightsPrompt(input);
    return output!;
});

// Exported Action
export async function generateHealthInsights(input: z.infer<typeof GenerateHealthInsightsInputSchema>) {
    return generateHealthInsightsFlow(input);
}
