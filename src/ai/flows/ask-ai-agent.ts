
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

// Define the output, which is the AI's response as a simple string
export type AskAiAgentOutput = string;

// Define the system prompt to set the AI's persona
const supportAgentPrompt = {
  system: `You are "LeaseLync Support AI," a helpful and friendly expert on property management, real estate finance, and using the LeaseLync application. Your goal is to provide clear, actionable insights.`,
};

// This is the main function the client will call
export async function askAiAgent(input: AskAiAgentInput): Promise<AskAiAgentOutput> {
  // 1. Separate the history from the new prompt
  const history = input.history.slice(0, -1);
  const lastUserMessage = input.history.at(-1);
  
  // 2. Safety Check: If there's no new message, don't call the API
  if (!lastUserMessage || lastUserMessage.role !== 'user') {
    console.error('askAiAgent: No valid last user message found.');
    return "I'm sorry, I didn't receive a valid message. Could you try rephrasing?";
  }
  
  // 3. Call the AI with a try...catch block for safety
  try {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: supportAgentPrompt.system,
      history: history,
      prompt: lastUserMessage.content,
    });
    
    // 4. CRITICAL, SAFE RESPONSE HANDLING
    const text = llmResponse.text;

    if (!text) {
      // This happens if the model's response is empty or blocked by safety settings
      console.error('askAiAgent: LLM response was empty or blocked.');
      return "I'm sorry, I was unable to generate a response for that request.";
    }
    
    return text;
  } catch (error) {
    // 5. Catch any other network or API errors
    console.error('askAiAgent: An unexpected error occurred:', error);
    return 'An error occurred while processing your request. Please try again later.';
  }
}
