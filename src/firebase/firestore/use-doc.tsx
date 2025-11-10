import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { useFirebase } from '../provider';
import { firestore } from '../index';

export const useDoc = <T>(
  targetRefOrPath: string | DocumentReference | null
) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthLoading, user } = useFirebase(); // Get auth state

  useEffect(() => {
    // **THE GUARD:** Do not do anything until Firebase Auth is 100% ready
    if (isAuthLoading || !user) {
      setLoading(false);
      return;
    }

    let docRef: DocumentReference;

    if (typeof targetRefOrPath === 'string') {
      docRef = doc(firestore, targetRefOrPath);
    } else if (targetRefOrPath) {
      docRef = targetRefOrPath;
    } else {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = { ...snapshot.data(), id: snapshot.id } as T;
          setData(docData);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error in useDoc:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [targetRefOrPath, isAuthLoading, user]); // Re-run if path or auth state changes

  return { data, error, loading };
};
