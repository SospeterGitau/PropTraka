"use client"; // Client component

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
  CollectionReference,
} from 'firebase/firestore';
import { useFirebase } from '../provider';
import { firestore } from '../index';

export const useCollection = <T>(
  targetRefOrQuery: string | Query | CollectionReference | null
) => {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthLoading, user } = useFirebase(); // Get auth state

  useEffect(() => {
    // **THE GUARD:** Do not do anything until Firebase Auth is 100% ready
    if (isAuthLoading || !user) {
      setLoading(false);
      return;
    }

    let queryRef: Query | CollectionReference;

    if (typeof targetRefOrQuery === 'string') {
      queryRef = collection(firestore, targetRefOrQuery);
    } else if (targetRefOrQuery) {
      queryRef = targetRefOrQuery;
    } else {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      queryRef,
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
        console.error('Error in useCollection:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [targetRefOrQuery, isAuthLoading, user]); 

  return { data, error, loading };
};
