'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input Schema
const AnalyzeMaintenanceRequestInputSchema = z.object({
    description: z.string().describe('Detailed description of the maintenance issue.'),
    propertyType: z.string().optional().describe('Type of property (e.g., Residential, Commercial) to help context.'),
});

// Output Schema
const AnalyzeMaintenanceRequestOutputSchema = z.object({
    category: z.string().describe('The most appropriate category for the issue (e.g., Plumbing, Electrical, HVAC, Appliance, Structural, Other).'),
    urgency: z.enum(['Low', 'Medium', 'High', 'Emergency']).describe('The calculated urgency level of the request.'),
    estimatedCost: z.number().describe('A rough estimated cost in the local currency for fixing this issue.'),
    recommendation: z.string().describe('A brief recommendation on immediate next steps or what type of contractor to hire.'),
});

// Prompt Definition
const maintenanceTriagePrompt = ai.definePrompt({
    name: 'maintenanceTriagePrompt',
    input: {
        schema: AnalyzeMaintenanceRequestInputSchema,
    },
    output: {
        schema: AnalyzeMaintenanceRequestOutputSchema,
    },
    prompt: `You are an expert Facility Manager and Maintenance Estimator.

  Analyze the following maintenance request:
  Description: "{{description}}"
  Property Type: {{propertyType}}

  Tasks:
  1. Categorize the issue into a standard maintenance category.
  2. Determine the Urgency based on safety, potential for property damage, and habitability.
     - Emergency: Immediate danger or major damage (e.g., flooding, gas leak).
     - High: Significant inconvenience or potential for damage (e.g., broken water heater, no heat in winter).
     - Medium: Standard repair needed (e.g., dripping faucet, appliance malfunction).
     - Low: Cosmetic or deferrable (e.g., peeling paint).
  3. Estimate the repair cost (Labor + Parts) conservatively.
  4. Provide a short recommendation.
  
  Return a JSON object.
  `,
});

// Flow Definition
const analyzeMaintenanceRequestFlow = ai.defineFlow({
    name: 'analyzeMaintenanceRequestFlow',
    inputSchema: AnalyzeMaintenanceRequestInputSchema,
    outputSchema: AnalyzeMaintenanceRequestOutputSchema,
}, async (input) => {
    const { output } = await maintenanceTriagePrompt(input);
    return output!;
});

// Exported Action
export async function analyzeMaintenanceRequest(input: z.infer<typeof AnalyzeMaintenanceRequestInputSchema>) {
    return analyzeMaintenanceRequestFlow(input);
}
