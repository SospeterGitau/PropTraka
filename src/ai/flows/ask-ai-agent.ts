'use server';
/**
 * @fileOverview A conversational AI agent for LeaseLync customer support.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the structure for a single chat message
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// Define the input for the flow, which is a history of messages
const AskAiAgentInputSchema = z.object({
  history: z.array(ChatMessageSchema),
});
export type AskAiAgentInput = z.infer<typeof AskAiAgentInputSchema>;

// Define the output, which is the AI's response
const AskAiAgentOutputSchema = z.object({
  content: z.string(),
});
export type AskAiAgentOutput = z.infer<typeof AskAiAgentOutputSchema>;

// This is the function the client will call
export async function askAiAgent(input: AskAiAgentInput): Promise<AskAiAgentOutput> {
  return askAiAgentFlow(input);
}

// Define the Genkit prompt with a system message to set the AI's persona
const supportAgentPrompt = {
  system: `You are "LeaseLync Support AI", a helpful and friendly expert on the LeaseLync application.
Your role is to assist landlords and property managers.
You have deep knowledge of all app features, including property management, financial tracking (revenue, expenses, arrears), maintenance requests, contractor management, and report generation.
You are an expert in Kenyan real estate finance and accounting principles.
Always be encouraging and guide users on how to best use the app to manage their property portfolio efficiently.
`,
  history: z.array(ChatMessageSchema),
};


// Define the main Genkit flow
const askAiAgentFlow = ai.defineFlow(
  {
    name: 'askAiAgentFlow',
    inputSchema: AskAiAgentInputSchema,
    outputSchema: AskAiAgentOutputSchema,
  },
  async (input) => {
    try {
      const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        ...supportAgentPrompt, // Spread the prompt object
        prompt: input.history.at(-1)?.content, // The prompt is the last user message
        history: input.history.slice(0, -1), // History is everything before the last message
      });

      const content = llmResponse.text ?? 'Sorry, I could not generate a response. Please try again.';
      return { content };
    } catch (e) {
        console.error("Error in askAiAgentFlow: ", e);
        return { content: 'An error occurred while processing your request. Please try again later.' };
    }
  }
);
