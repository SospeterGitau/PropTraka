import { useMemo } from 'react';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useCollection } from '../firebase/firestore/use-collection';
import { useFirebase } from '../firebase/provider';

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Timestamp;
}

export const useChat = () => {
  const { user, isAuthLoading } = useFirebase();

  const chatCollectionRef = useMemo(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/chatMessages`);
  }, [user]);

  const chatQuery = useMemo(() => {
    if (!chatCollectionRef) return null;
    return query(chatCollectionRef, orderBy('timestamp', 'asc'));
  }, [chatCollectionRef]);

  const {
    data: messages,
    error,
    loading,
  } = useCollection<ChatMessage>(chatQuery);

  return { messages, error, loading: loading || isAuthLoading };
};