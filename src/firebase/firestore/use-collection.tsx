
'use client';
    
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
  CollectionReference,
  FirestoreError,
} from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase'; // Using central exports
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Array of documents with ID, or null.
  loading: boolean;          // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references and queries.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {Query<DocumentData> | CollectionReference<DocumentData> | null | undefined} memoizedTargetRefOrQuery -
 *   The memoized Firestore query or collection reference. The hook will wait if this is null or undefined.
 * @returns {UseCollectionResult<T>} Object with data, loading, and error states.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: Query<DocumentData> | CollectionReference<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const { isUserLoading, user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // **GUARD CLAUSE:** If auth is loading, or there's no user, or no query, then wait.
    if (isUserLoading || !user || !memoizedTargetRefOrQuery) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<T>));
        setData(docs);
        setError(null); // Clear previous errors on a successful snapshot
        setLoading(false);
      },
      (error: FirestoreError) => {
        const path = (memoizedTargetRefOrQuery as CollectionReference).path || 'unknown path';
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        });

        setError(contextualError);
        setData(null);
        setLoading(false);

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, isUserLoading, user, firestore]);

  return { data, loading, error };
}
