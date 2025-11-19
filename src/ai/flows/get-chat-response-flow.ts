
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
Your role is to answer user questions based ONLY on the provided Knowledge Base.
If the answer is not in the knowledge base, you must state that you do not have the information and cannot help.
Do not make up answers.

Here is the user's question:
"{{{question}}}"

Here is the Knowledge Base you must use to answer the question:
{{{knowledgeBase}}}

Based on the knowledge base, provide a clear and concise answer to the user's question.
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
