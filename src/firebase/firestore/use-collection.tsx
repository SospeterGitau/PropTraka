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
      // If auth is loading or user is not logged in, stop.
      setLoading(false);
      return;
    }

    let queryRef: Query | CollectionReference;

    if (typeof targetRefOrQuery === 'string') {
      queryRef = collection(firestore, targetRefOrQuery);
    } else if (targetRefOrQuery) {
      queryRef = targetRefOrQuery;
    } else {
      // If the query is null (e.g., waiting for user), stop.
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
        // This is where the "Missing or insufficient permissions" error
        // was coming from. It will now be caught and handled safely.
        console.error('Error in useCollection:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [targetRefOrQuery, isAuthLoading, user]); // Re-run if query or auth state changes

  return { data, error, loading };
};
