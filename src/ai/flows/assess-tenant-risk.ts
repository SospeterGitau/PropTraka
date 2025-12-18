'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input Schema
const AssessTenantRiskInputSchema = z.object({
    income: z.number().describe('Monthly income of the applicant.'),
    rentAmount: z.number().describe('Proposed monthly rent amount.'),
    employmentStatus: z.string().describe('Applicants employment status (e.g., Employed, Self-Employed, Unemployed).'),
    creditScore: z.number().optional().describe('Credit score if available (300-850).'),
    history: z.string().optional().describe('Brief rental history or additional notes provided by applicant.'),
});

// Output Schema
const AssessTenantRiskOutputSchema = z.object({
    riskScore: z.number().describe('A calculated risk score from 0 (High Risk) to 100 (Low Risk).'),
    riskLevel: z.enum(['Low', 'Medium', 'High']).describe('Categorized risk level based on the score.'),
    factors: z.array(z.string()).describe('List of key positive or negative factors influencing the score.'),
    recommendation: z.string().describe('Advice on whether to approve, reject, or request a guarantor.'),
});

// Prompt Definition
const tenantRiskPrompt = ai.definePrompt({
    name: 'tenantRiskPrompt',
    input: {
        schema: AssessTenantRiskInputSchema,
    },
    output: {
        schema: AssessTenantRiskOutputSchema,
    },
    prompt: `You are a Risk Underwriter for a property management firm.

  Assess the risk of the following tenant application:
  - Monthly Income: {{income}}
  - Rent Amount: {{rentAmount}}
  - Employment: {{employmentStatus}}
  - Credit Score: {{creditScore}}
  - History/Notes: {{history}}

  **Guidelines:**
  - **Rent-to-Income Ratio**: Ideally rent should be < 30% of income. High ratio = High Risk.
  - **Credit Score**: >700 is good, <600 is risky.
  - **Employment**: "Employed" is safer than "Unemployed".

  Provide a Risk Score (0-100), Level, Factors, and Recommendation.
  `,
});

// Flow Definition
const assessTenantRiskFlow = ai.defineFlow({
    name: 'assessTenantRiskFlow',
    inputSchema: AssessTenantRiskInputSchema,
    outputSchema: AssessTenantRiskOutputSchema,
}, async (input) => {
    const { output } = await tenantRiskPrompt(input);
    return output!;
});

// Exported Action
export async function assessTenantRisk(input: z.infer<typeof AssessTenantRiskInputSchema>) {
    return assessTenantRiskFlow(input);
}
