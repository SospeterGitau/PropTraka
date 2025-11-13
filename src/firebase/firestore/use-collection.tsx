
"use client"; // Client component

import { useState, useEffect } from 'react';
import {
  query,
  onSnapshot,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { useFirebase } from '../provider';

export const useCollection = <T>(
  targetQuery: Query | null
): [T[], boolean, Error | null] => {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthLoading, user } = useFirebase();

  useEffect(() => {
    if (isAuthLoading || !user || !targetQuery) {
      if (!isAuthLoading && !user) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      targetQuery,
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
        console.error(`Error in useCollection:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [targetQuery, isAuthLoading, user]); 

  return [data, loading, error];
};
