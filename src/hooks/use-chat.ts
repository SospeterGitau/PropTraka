
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

  const chatCollectionRef = useMemo(() => {
    if (!user) return null;
    return collection(firestore, 'chatMessages');
  }, [user]);

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
    
    // If a message is currently being sent, don't update from the snapshot
    // to prevent the optimistic update from being overwritten.
    if (isSending) return;

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

    return () => unsubscribe();
  }, [chatCollectionRef, user, isUserLoading, isSending]);

  const sendMessage = useCallback(async (text: string) => {
    if (!chatCollectionRef || !user) {
        setError(new Error("User or chat collection not available."));
        return;
    }

    setIsSending(true);

    const userMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: text,
    };
    
    // Optimistic update for the user's message
    setMessages(prev => [...prev, userMessage]);

    try {
        // Save user message to Firestore.
        const userMessageForDb = { role: 'user', content: text, ownerId: user.uid, timestamp: Timestamp.now() };
        addDoc(chatCollectionRef, userMessageForDb);

        const currentHistory = [...messages, userMessage];

        const aiInput: AskAiAgentInput = {
            history: currentHistory.map(({ role, content }) => ({ role, content })),
        };
        
        const aiResponse = await askAiAgent(aiInput);

        const aiMessage: ChatMessage = {
            id: `temp-ai-${Date.now()}`,
            role: 'model',
            content: aiResponse.content,
        };

        // Save AI message to Firestore.
        const aiMessageForDb = { ...aiMessage, ownerId: user.uid, timestamp: Timestamp.now() };
        addDoc(chatCollectionRef, aiMessageForDb);

        // Optimistic update for the AI's message
        setMessages(prev => [...prev.filter(m => m.id !== userMessage.id), { ...userMessageForDb, id: userMessage.id }, aiMessage]);


    } catch (e) {
        console.error("Failed to send message or get AI response:", e);
        setError(e instanceof Error ? e : new Error("An unknown error occurred."));
        // Revert optimistic update on error
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));

    } finally {
        setIsSending(false);
    }
  }, [chatCollectionRef, user, messages]);


  return { messages, error, isLoading, isSending, sendMessage };
};
