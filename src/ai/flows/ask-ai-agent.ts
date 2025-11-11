
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/firebase/admin';

// Ensure the admin app is initialized before using Firestore
getAdminApp(); 
const db = getFirestore();

// 1. Define the schemas
// This is the structure the frontend sends
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const AskAiAgentInputSchema = z.object({
  history: z.array(ChatMessageSchema),
});

export type AskAiAgentInput = z.infer<typeof AskAiAgentInputSchema>;

// 2. --- NEW: KNOWLEDGE BASE FUNCTION ---
// This function will search our Firestore "brain"
async function searchKnowledgeBase(question: string): Promise<string> {
  try {
    const knowledgeBaseRef = db.collection('knowledgeBase');
    // This is a simple query. It finds articles where the 'title'
    // is greater than or equal to the user's question.
    // A more complex search (e.g., text-embedding) can be added later.
    const snapshot = await knowledgeBaseRef
      .where('title', '>=', question.toLowerCase())
      .limit(3)
      .get();

    if (snapshot.empty) {
      return "No relevant information found in the knowledge base.";
    }

    let retrievedFacts = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      retrievedFacts += `Article: "${data.title}"\nContent: "${data.content}"\n\n`;
    });

    return retrievedFacts;
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return "Error retrieving knowledge.";
  }
}

// 3. --- THIS IS THE MAIN AI FLOW ---
export async function askAiAgent(
  input: AskAiAgentInput
): Promise<string> {

  // 4. Correctly separate the history from the new prompt
  const history = input.history.slice(0, -1); // All messages except the last one
  const lastUserMessage = input.history.at(-1); // The last message

  // 5. Add safety checks
  if (!lastUserMessage || lastUserMessage.role !== 'user') {
    console.error('askAiAgent: No valid last user message found.');
    return "I'm sorry, I didn't receive a valid message. Could you try rephrasing?";
  }
  
  // 5. --- NEW: CALL THE KNOWLEDGE BASE ---
  const retrievedFacts = await searchKnowledgeBase(lastUserMessage.content);

  // 6. --- NEW: CREATE THE AUGMENTED PROMPT ---
  const newSystemPrompt = `You are "LeaseLync Support AI," a helpful expert on property management.

CRITICAL INSTRUCTION: You MUST answer the user's question using ONLY the "Custom Knowledge" articles provided below.

If the "Custom Knowledge" does not contain the answer, you MUST politely state that you can only answer questions about app features and user journeys. Do NOT use your general knowledge.

CUSTOM KNOWLEDGE:
${retrievedFacts}
---`;


  // 7. Call the AI with the NEW prompt
  try {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: newSystemPrompt, // <-- Use the NEW augmented prompt
      prompt: lastUserMessage.content,
      history: history,
    });

    // 8. Use the *correct* safe response handling
    const text = llmResponse.text;
    if (!text) {
      // This happens if the model's response is empty or blocked
      console.error('askAiAgent: LLM response was empty or blocked by safety settings.');
      return 'I\'m sorry, I was unable to generate a response for that request.';
    }
    return text;

  } catch (error) {
    console.error('askAiAgent: An unexpected error occurred in the AI flow:', error);
    return 'An error occurred while processing your request. Please try again later.';
  }
}
