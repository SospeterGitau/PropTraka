'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PortfolioAssistantInputSchema, PortfolioAssistantOutputSchema } from './schemas';

// Prompt Definition
const portfolioAssistantPrompt = ai.definePrompt({
    name: 'portfolioAssistantPrompt',
    input: {
        schema: PortfolioAssistantInputSchema,
    },
    output: {
        schema: PortfolioAssistantOutputSchema,
    },
    prompt: `You are PropTraka Assistant, an expert property management AI.
  
  You have access to the following simplified portfolio data:
  {{{portfolioContext}}}

  User Question:
  "{{{question}}}"

  **Instructions:**
  1. Answer the question using ONLY the provided data.
  2. If the answer is in the data, be specific (cite names, amounts, property names).
  3. If the data is missing or incomplete to answer the question, politely say so.
  4. Format your answer using the Pyramid Principle: Direct answer first, then details.
  5. Use bullet points for lists (e.g. list of tenants in arrears).
  
  Tone: Professional, helpful, and data-driven.
  `,
});

// Flow Definition
const portfolioAssistantChatFlow = ai.defineFlow({
    name: 'portfolioAssistantChatFlow',
    inputSchema: PortfolioAssistantInputSchema,
    outputSchema: PortfolioAssistantOutputSchema,
}, async (input) => {
    const { output } = await portfolioAssistantPrompt(input);
    return output!;
});

// Exported Action
export async function portfolioAssistantChat(input: z.infer<typeof PortfolioAssistantInputSchema>) {
    return portfolioAssistantChatFlow(input);
}
