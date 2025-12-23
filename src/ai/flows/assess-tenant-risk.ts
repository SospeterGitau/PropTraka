'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input Schema
const AssessTenantRiskInputSchema = z.object({
    personal: z.object({
        age: z.number().optional(),
        householdSize: z.number().optional(),
    }).optional(),
    financial: z.object({
        income: z.number(),
        rentAmount: z.number(),
        employmentType: z.enum(['Formal', 'Informal', 'Unemployed']),
        creditScore: z.number().optional(), // For Formal
        mobileMoneyData: z.object({
            avgMonthlyIncoming: z.number().optional(),
            avgMonthlyBalance: z.number().optional(),
            statementVerified: z.boolean().default(false), // True if matched with PDF
        }).optional(),
    }),
    rentalHistory: z.object({
        yearsAtCurrent: z.number().optional(),
        reasonForMoving: z.string().optional(),
    }).optional(),
    verificationMethod: z.enum(['MANUAL_UPLOAD', 'API_VERIFIED', 'NONE']).default('MANUAL_UPLOAD'),
});

// Output Schema
const AssessTenantRiskOutputSchema = z.object({
    riskScore: z.number().describe('0 (High Risk) to 100 (Low Risk).'),
    riskLevel: z.enum(['Low', 'Medium', 'High']),
    confidenceScore: z.number().describe('0.0 to 1.0 confidence in this score based on data verification.'),
    factors: z.array(z.string()).describe('Key factors influencing the score.'),
    recommendation: z.string(),
    verificationWarning: z.string().optional().describe('Warning if manual data is unverified.'),
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
    prompt: `You are a Senior Risk Underwriter for the African Real Estate Market.

  **Applicant Profile:**
  - Employment: {{financial.employmentType}}
  - Reported Income: {{financial.income}}
  - Rent: {{financial.rentAmount}}
  - Credit Score: {{financial.creditScore}} (Formal only)
  
  **Informal Sector / Alternative Data:**
  - Avg M-Pesa Incoming: {{financial.mobileMoneyData.avgMonthlyIncoming}}
  - Avg M-Pesa Balance: {{financial.mobileMoneyData.avgMonthlyBalance}}
  - Statement Verified: {{financial.mobileMoneyData.statementVerified}}
  
  **Verification Method:** {{verificationMethod}}

  **Scoring Rules:**
  1. **Formal Employees**: Prioritize Rent-to-Income (<30% ideal) and Credit Score.
  2. **Informal/Traders**: IGNORE Credit Score. Prioritize **Cash Flow Consistency** (M-Pesa Incoming) and **Liquidity** (Avg Balance).
     - If M-Pesa Incoming > 3x Rent, treat as stable income.
     - If Avg Balance > 1x Rent, treat as good liquidity buffer.
  3. **Verification Penalty**:
     - If verificationMethod is 'MANUAL_UPLOAD' and 'Statement Verified' is false, **CAP Confidence Score at 0.7**.
     - Add a 'verificationWarning': "Risk Score is based on self-reported figures. Please audit the uploaded PDF statements."

  **Output:**
  - Risk Score (0-100)
  - Risk Level
  - Confidence Score (Lower if unverified)
  - Factors (Specific reasons, e.g., "Strong M-Pesa cash flow", "Unverified manual entry")
  - Recommendation (Approve, Reject, Request Guarantor)
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
