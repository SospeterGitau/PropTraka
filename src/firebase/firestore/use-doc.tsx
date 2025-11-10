import { useState, useEffect, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { useFirebase } from '../provider';
import { firestore } from '../index';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export const useDoc = <T>(
  targetRefOrPath: string | DocumentReference | null
): { data: T | null; error: Error | null; loading: boolean } => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthLoading } = useFirebase();
  
  // This is the critical fix. The memoized ref now DEPENDS on the user object.
  // This ensures that if a path is constructed with a user ID, it will be
  // re-evaluated when the user logs in.
  const memoizedRef = useMemo(() => {
    if (!user || !targetRefOrPath) return null; // Guard against running without a user

    if (typeof targetRefOrPath === 'string') {
      return doc(firestore, targetRefOrPath);
    }
    return targetRefOrPath;
  }, [targetRefOrPath, user]); // CRITICAL: Added `user` as a dependency.


  useEffect(() => {
    // Auth Gate: Wait until Firebase has confirmed the auth state.
    if (isAuthLoading) {
      setLoading(true);
      return;
    }

    // If there's no user or no document to fetch, we are done.
    if (!user || !memoizedRef) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      memoizedRef,
      (doc) => {
        if (doc.exists()) {
          setData({ ...doc.data(), id: doc.id } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error in useDoc:', err);
        setError(err);
        
        if (err.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: memoizedRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedRef, user, isAuthLoading]); // Effect now correctly re-runs when memoizedRef changes.

  return { data, error, loading };
};
