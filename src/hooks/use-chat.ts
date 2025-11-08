
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { askAiAgent } from '@/ai/flows/ask-ai-agent';
import { collection, doc, setDoc, serverTimestamp, query, onSnapshot, QuerySnapshot, DocumentData, FirestoreError } from 'firebase/firestore';
import { useToast } from './use-toast';
import type { ChatMessage } from '@/lib/types';

export function useChat() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<FirestoreError | null>(null);

  const chatCollectionRef = useMemo(() => 
    user ? collection(firestore, `users/${user.uid}/chatMessages`) : null,
    [firestore, user]
  );
  
  useEffect(() => {
    if (!chatCollectionRef) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const simpleQuery = query(chatCollectionRef);

    const unsubscribe = onSnapshot(simpleQuery, 
      (snapshot: QuerySnapshot<DocumentData>) => {
        const unsortedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ChatMessage));

        // Manually sort messages on the client-side.
        const sortedMessages = unsortedMessages.sort((a, b) => {
          const aTime = a.timestamp?.toMillis() || 0;
          const bTime = b.timestamp?.toMillis() || 0;
          return aTime - bTime;
        });

        setMessages(sortedMessages);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error("Error fetching chat messages:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [chatCollectionRef]);


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

    const userMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'user',
      content,
      ownerId: user.uid,
    };
    const userMessageRef = doc(chatCollectionRef);
    await setDoc(userMessageRef, { ...userMessage, timestamp: serverTimestamp() });
    
    // Create history for the AI call from the current state
    const updatedHistory = [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user' as const, content }];

    try {
      const aiResponse = await askAiAgent({ history: updatedHistory });

      const modelMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        role: 'model',
        content: aiResponse.content,
        ownerId: user.uid,
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
      const errorMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        role: 'model',
        content: 'Sorry, I encountered an error. Please try again.',
        ownerId: user.uid,
      };
      const errorMessageRef = doc(chatCollectionRef);
      await setDoc(errorMessageRef, { ...errorMessage, timestamp: serverTimestamp() });
    } finally {
      setIsSending(false);
    }
  }, [user, chatCollectionRef, messages, toast]);

  return {
    messages,
    sendMessage,
    isLoading: isLoading && messages.length === 0,
    isSending,
    error
  };
}
