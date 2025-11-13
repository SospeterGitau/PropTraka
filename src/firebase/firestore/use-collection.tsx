
"use client"; // Client component

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
  where,
} from 'firebase/firestore';
import { useFirebase } from '../provider';
import { firestore } from '../index';

export const useCollection = <T>(
  path: string | null
): { data: T[]; error: Error | null; loading: boolean } => {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthLoading, user } = useFirebase();

  useEffect(() => {
    if (isAuthLoading || !user || !path) {
      if (!isAuthLoading && !user) {
        setLoading(false);
      }
      return;
    }

    const collectionRef = collection(firestore, path);
    const q = query(collectionRef, where('ownerId', '==', user.uid));

    setLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as T[];
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error in useCollection for path "${path}":`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path, isAuthLoading, user]); 

  return { data, error, loading };
};
