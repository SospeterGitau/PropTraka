import { useState, useEffect, useMemo } from 'react';
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
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export const useCollection = <T>(
  targetRefOrQuery: string | Query | CollectionReference | null
): { data: T[]; error: Error | null; loading: boolean } => {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isUserLoading } = useFirebase();

  // Memoize the query to prevent re-renders from creating new query objects
  const memoizedQuery = useMemo(() => {
    if (!targetRefOrQuery) return null;
    if (typeof targetRefOrQuery === 'string') {
      return query(collection(firestore, targetRefOrQuery));
    }
    return targetRefOrQuery;
  }, [targetRefOrQuery]);

  useEffect(() => {
    // The Auth Gate: Do not proceed if there is no user object.
    // The FirebaseProvider ensures this hook only runs after the initial auth check.
    if (isUserLoading || !user) {
      setLoading(false);
      return;
    }

    if (!memoizedQuery) {
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      memoizedQuery,
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
        
        // Emit a structured permission error for better debugging
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: 'path' in memoizedQuery ? memoizedQuery.path : 'unknown',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery, user, isUserLoading]); // Re-run only when the query or user changes

  return { data, error, loading };
};
