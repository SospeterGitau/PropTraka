import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { useFirebase } from '../provider'; // Import from our new provider
import { firestore } from '../index'; // Import the firestore instance

// This hook is for fetching a SINGLE document
export const useDoc = <T>(
  targetRefOrPath: string | DocumentReference | null
) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // Get the auth state from our new provider
  const { isAuthLoading, user } = useFirebase();

  useEffect(() => {
    // **THE GUARD:** Do not do anything until Firebase Auth is 100% ready
    // and has confirmed we have a user.
    if (isAuthLoading || !user) {
      setLoading(false);
      return; // Do not run the query
    }

    let docRef: DocumentReference;

    if (typeof targetRefOrPath === 'string') {
      docRef = doc(firestore, targetRefOrPath);
    } else if (targetRefOrPath) {
      docRef = targetRefOrPath;
    } else {
      setLoading(false);
      return; // No valid path provided
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
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
        setError(err); // This will now show the REAL error
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [targetRefOrPath, isAuthLoading, user]); // Re-run if query or auth state changes

  return { data, error, loading };
};
