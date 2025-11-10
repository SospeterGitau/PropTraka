
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { useFirebase } from '../firebase/provider';

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Timestamp;
}

export const useChat = () => {
  const { user, isAuthLoading } = useFirebase();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const chatCollectionRef = useMemo(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/chatMessages`);
  }, [user]);

  useEffect(() => {
    // Auth Gate: Wait for authentication to be ready
    if (isAuthLoading) {
      setLoading(true);
      return;
    }

    // If there's no user or no collection reference, we're done.
    if (!user || !chatCollectionRef) {
      setLoading(false);
      setMessages([]);
      return;
    }

    setLoading(true);

    // Use a simple query as instructed
    const chatQuery = query(chatCollectionRef);

    const unsubscribe = onSnapshot(
      chatQuery,
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[];

        // Perform client-side sorting as instructed
        fetchedMessages.sort(
          (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()
        );

        setMessages(fetchedMessages);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error in useChat (onSnapshot):', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [chatCollectionRef, user, isAuthLoading]);

  return { messages, error, loading };
};
