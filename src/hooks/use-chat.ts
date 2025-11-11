
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Timestamp,
  where,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { useUser } from '../firebase/provider';
import { askAiAgent, type AskAiAgentInput } from '@/ai/flows/ask-ai-agent';

/**
 * @fileOverview This hook manages the state and interactions for the AI chat feature.
 * It handles fetching chat history, sending new messages, and receiving AI responses.
 *
 * @hook useChat
 * @returns {object} An object containing:
 * - `messages`: An array of `ChatMessage` objects representing the conversation.
 * - `error`: Any error that occurred during fetching or sending messages.
 * - `isLoading`: A boolean indicating if the initial chat history is being loaded.
 * - `isSending`: A boolean indicating if a message is currently being sent to the AI.
 * - `sendMessage`: A function to send a new message from the user.
 */

/**
 * Defines the structure of a single chat message.
 */
export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: Timestamp;
}

export const useChat = () => {
  const { user, isUserLoading } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoize the Firestore collection reference to prevent re-renders.
  const chatCollectionRef = useMemo(() => {
    if (!user) return null;
    return collection(firestore, 'chatMessages');
  }, [user]);

  // Effect to subscribe to chat history from Firestore.
  useEffect(() => {
    if (isUserLoading) {
      setIsLoading(true);
      return;
    }

    if (!user || !chatCollectionRef) {
      setIsLoading(false);
      setMessages([]);
      return;
    }
    
    setIsLoading(true);

    const chatQuery = query(
        chatCollectionRef, 
        where('ownerId', '==', user.uid),
        orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      chatQuery,
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (ChatMessage & { timestamp: Timestamp })[];
        
        setMessages(fetchedMessages);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error in useChat (onSnapshot):', err);
        setError(err);
        setIsLoading(false);
      }
    );

    // Cleanup the subscription on unmount.
    return () => unsubscribe();
  }, [chatCollectionRef, user, isUserLoading]);

  /**
   * Sends a user's message, gets a response from the AI, and updates the state.
   * @param {string} text - The content of the user's message.
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!chatCollectionRef || !user) {
        setError(new Error("User or chat collection not available."));
        return;
    }

    setIsSending(true);

    const userMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`, // Temporary ID for optimistic UI update
        role: 'user',
        content: text,
    };
    
    // Optimistic update: Add the user's message to the UI immediately.
    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);

    try {
        // Prepare a clean history for the AI, removing any temporary messages.
        const cleanHistory = currentHistory.filter(m => !m.id?.startsWith('temp-'));
        
        const aiInput: AskAiAgentInput = {
            history: cleanHistory.map(({ role, content }) => ({ role, content })),
        };
        
        // Call the server-side AI flow.
        const aiResponse = await askAiAgent(aiInput);

        const aiMessage: ChatMessage = {
            id: `temp-ai-${Date.now()}`,
            role: 'model',
            content: aiResponse,
        };
        // Add the AI's response to the UI.
        setMessages(prev => [...prev, aiMessage]);
        
        // Asynchronously save both messages to Firestore.
        // The onSnapshot listener will eventually sync the state, replacing temp IDs.
        const userMessageForDb = { role: 'user', content: text, ownerId: user.uid, timestamp: Timestamp.now() };
        const aiMessageForDb = { role: 'model', content: aiResponse, ownerId: user.uid, timestamp: Timestamp.now() };

        await addDoc(chatCollectionRef, userMessageForDb);
        await addDoc(chatCollectionRef, aiMessageForDb);
        
    } catch (e) {
        console.error("Failed to send message or get AI response:", e);
        const errMessage = e instanceof Error ? e : new Error("An unknown error occurred.");
        setError(errMessage);
        
        // Display an error message in the chat UI.
        const errorMessage: ChatMessage = {
          id: `temp-error-${Date.now()}`,
          role: 'model',
          content: 'An error occurred while processing your request. Please try again later.'
        };
        setMessages(prev => [...prev, errorMessage]);

    } finally {
        setIsSending(false);
    }
  }, [chatCollectionRef, user, messages]);


  return { messages, error, isLoading, isSending, sendMessage };
};
