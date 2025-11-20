
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a chat response
 * based on a user's query and a provided knowledge base.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { KnowledgeArticle } from '@/lib/types';

// Define the input schema for the chat response flow
const GetChatResponseInputSchema = z.object({
  question: z.string().describe('The user\'s question.'),
  knowledgeBase: z.string().describe('A JSON string representing an array of knowledge base articles.'),
});

// Define the output schema for the chat response
const GetChatResponseOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});

// Define the main function that triggers the flow
export async function getChatResponse(
  input: z.infer<typeof GetChatResponseInputSchema>
): Promise<z.infer<typeof GetChatResponseOutputSchema>> {
  return getChatResponseFlow(input);
}

// Define the prompt
const chatResponsePrompt = ai.definePrompt({
  name: 'chatResponsePrompt',
  input: {
    schema: GetChatResponseInputSchema,
  },
  output: {
    schema: GetChatResponseOutputSchema,
  },
  prompt: `You are an expert AI assistant for a property management app called PropTraka.
Your tone should be helpful, friendly, and professional.

**Your primary goal is to answer user questions based ONLY on the provided Knowledge Base.**

**Response Structure (MANDATORY):**
You must follow the Pyramid Principle for all answers.
1.  **Start with the main point.** Give a direct, one-sentence answer to the user's question first.
2.  **Provide supporting details.** After the main point, elaborate with more information, steps, or context as needed.

**Content Rules:**
- If the answer is found in the knowledge base, provide a clear answer based on that information.
- If, and only if, the answer is NOT in the knowledge base, you are permitted to use your general knowledge. When you do this, you MUST add a disclaimer at the end of your answer, such as: "Please note, this information is based on my general knowledge and is not specific to the PropTraka app."
- Never make up answers about the PropTraka app itself.

Here is the user's question:
"{{{question}}}"

Here is the Knowledge Base you must use to answer the question:
{{{knowledgeBase}}}

Based on these instructions, provide the best possible answer.
  `,
});

// Define the flow
const getChatResponseFlow = ai.defineFlow(
  {
    name: 'getChatResponseFlow',
    inputSchema: GetChatResponseInputSchema,
    outputSchema: GetChatResponseOutputSchema,
  },
  async (input) => {
    const { output } = await chatResponsePrompt(input);
    return output!;
  }
);
