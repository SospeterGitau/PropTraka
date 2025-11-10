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
  const { user, isAuthLoading } = useFirebase();

  // This is the critical fix. The memoized query now DEPENDS on the user object.
  // When the user logs in (or out), this memo is re-evaluated, creating a new,
  // correct query object. This new object instance triggers the useEffect below.
  const memoizedQuery = useMemo(() => {
    if (!user || !targetRefOrQuery) return null; // Guard against running without a user

    if (typeof targetRefOrQuery === 'string') {
      return query(collection(firestore, targetRefOrQuery));
    }
    return targetRefOrQuery;
  }, [targetRefOrQuery, user]); // CRITICAL: Added `user` as a dependency.

  useEffect(() => {
    // Auth Gate: Wait until Firebase has confirmed the auth state.
    if (isAuthLoading) {
      setLoading(true);
      return;
    }
    
    // If there's no user or no query to run, we are done.
    if (!user || !memoizedQuery) {
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
        
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: 'path' in memoizedQuery ? (memoizedQuery as any).path : 'unknown',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery, user, isAuthLoading]); // Effect now correctly re-runs when memoizedQuery changes.

  return { data, error, loading };
};
