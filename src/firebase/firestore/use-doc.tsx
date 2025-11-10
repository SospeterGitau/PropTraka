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
  const { user } = useFirebase();
  
  const memoizedRef = useMemo(() => {
    if (!targetRefOrPath) return null;
    if (typeof targetRefOrPath === 'string') {
      return doc(firestore, targetRefOrPath);
    }
    return targetRefOrPath;
  }, [targetRefOrPath]);


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!memoizedRef) {
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
  }, [memoizedRef, user]);

  return { data, error, loading };
};
