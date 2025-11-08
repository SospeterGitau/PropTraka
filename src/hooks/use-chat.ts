
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { askAiAgent } from '@/ai/flows/ask-ai-agent';
import { collection, doc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from './use-toast';
import type { ChatMessage } from '@/lib/types';

export function useChat() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const chatCollectionRef = useMemo(() => 
    user ? collection(firestore, `users/${user.uid}/chatMessages`) : null,
    [firestore, user]
  );
  
  // Removed orderBy to simplify the query and avoid indexing issues.
  const chatQuery = useMemo(() => 
    chatCollectionRef ? query(chatCollectionRef) : null,
    [chatCollectionRef]
  );

  const { data: unsortedMessages, isLoading } = useCollection<ChatMessage>(chatQuery);

  // Manually sort messages on the client-side.
  const messages = useMemo(() => {
    if (!unsortedMessages) return [];
    return [...unsortedMessages].sort((a, b) => {
      const aTime = a.timestamp?.toMillis() || 0;
      const bTime = b.timestamp?.toMillis() || 0;
      return aTime - bTime;
    });
  }, [unsortedMessages]);


  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !chatCollectionRef) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to chat.',
      });
      return;
    }

    setIsSending(true);

    // 1. Add user message to Firestore
    const userMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'user',
      content,
    };
    // Create a new doc ref to get an ID
    const userMessageRef = doc(chatCollectionRef);
    // Use setDoc to correctly handle serverTimestamp
    await setDoc(userMessageRef, { ...userMessage, timestamp: serverTimestamp() });
    
    // The useCollection hook will automatically update the local `messages` state.
    // We create a temporary history for the AI call.
    const currentHistory = (messages || []).map(m => ({ role: m.role, content: m.content }));
    const updatedHistory = [...currentHistory, { role: 'user' as const, content }];

    try {
      // 2. Call the AI agent
      const aiResponse = await askAiAgent({ history: updatedHistory });

      // 3. Add AI response to Firestore
      const modelMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        role: 'model',
        content: aiResponse.content,
      };
      const modelMessageRef = doc(chatCollectionRef);
      await setDoc(modelMessageRef, { ...modelMessage, timestamp: serverTimestamp() });

    } catch (error) {
      console.error('Error calling AI agent:', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'The AI agent failed to respond. Please try again.',
      });
      // Optionally, add an error message to the chat history in Firestore
      const errorMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        role: 'model',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      const errorMessageRef = doc(chatCollectionRef);
      await setDoc(errorMessageRef, { ...errorMessage, timestamp: serverTimestamp() });
    } finally {
      setIsSending(false);
    }
  }, [user, chatCollectionRef, messages, toast]);

  return {
    messages: messages || [],
    sendMessage,
    isLoading: isLoading && messages === null, // Only loading on the very first fetch
    isSending, // True when waiting for AI response
  };
}
