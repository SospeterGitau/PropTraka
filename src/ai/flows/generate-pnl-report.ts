'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { GeneratePnlReportInput, GeneratePnlReportOutput } from '@/lib/types';

const GeneratePnlReportInputSchema = z.object({
  startDate: z.string().describe('Start date for the P&L report (YYYY-MM-DD format)'),
  endDate: z.string().describe('End date for the P&L report (YYYY-MM-DD format)'),
  propertyIds: z.array(z.string()).optional().describe('List of property IDs to include'),
  isResident: z.boolean().optional().describe('Whether the resident status applies'),
  isNonResident: z.boolean().optional().describe('Whether the non-resident status applies'),
});

const GeneratePnlReportOutputSchema = z.object({
  report: z.string().nullable().describe('The generated P&L report as text'),
  error: z.string().nullable().optional().describe('Error message if generation failed'),
  hint: z.string().optional().describe('Helpful hint if error occurred'),
});

export async function generatePnlReport(input: GeneratePnlReportInput): Promise<GeneratePnlReportOutput> {
  return generatePnlReportFlow(input);
}

const pnlReportPrompt = ai.definePrompt({
  name: 'generatePnlReportPrompt',
  input: { schema: GeneratePnlReportInputSchema },
  output: { schema: GeneratePnlReportOutputSchema },
  prompt: `Generate a P&L report for the specified date range and properties.

Start Date: {{{startDate}}}
End Date: {{{endDate}}}
Properties: {{{propertyIds}}}

Provide a comprehensive profit and loss statement.`,
});

const generatePnlReportFlow = ai.defineFlow(
  {
    name: 'generatePnlReportFlow',
    inputSchema: GeneratePnlReportInputSchema,
    outputSchema: GeneratePnlReportOutputSchema,
  },
  async (input) => {
    const { output } = await pnlReportPrompt(input);
    return output!;
  }
);
