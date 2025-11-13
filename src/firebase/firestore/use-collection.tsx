"use client"; // Client component

import {
  onSnapshot,
  Query,
  DocumentData,
  CollectionReference,
} from 'firebase/firestore';
import { useSyncExternalStore } from 'react';

// A basic in-memory cache to store results.
const cache = new Map<string, any>();
const listeners = new Map<string, Set<() => void>>();

function getCacheKey(target: Query | CollectionReference): string {
    if ('path' in target) {
        // It's a CollectionReference, use its path.
        return target.path;
    }
    // For queries, we need a more robust way to create a key.
    // This is a simplified version; a real implementation might need to serialize the query constraints.
    // @ts-ignore - _query is a private property but accessible for this purpose.
    const queryKey = JSON.stringify(target._query);
    return queryKey;
}

export const useCollection = <T>(
  targetRefOrQuery: Query | CollectionReference | null
): [T[] | undefined, boolean, Error | undefined] => {
  const store = useSyncExternalStore(
    (callback) => {
      if (!targetRefOrQuery) {
        return () => {};
      }

      const cacheKey = getCacheKey(targetRefOrQuery);
      if (!listeners.has(cacheKey)) {
        listeners.set(cacheKey, new Set());
      }
      listeners.get(cacheKey)!.add(callback);
      
      const unsubscribe = onSnapshot(
        targetRefOrQuery,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          })) as T[];
          
          cache.set(cacheKey, { value: docs, loading: false, error: undefined });
          listeners.get(cacheKey)?.forEach(l => l());
        },
        (err) => {
          console.error('Error in useCollection:', err);
          cache.set(cacheKey, { value: undefined, loading: false, error: err });
          listeners.get(cacheKey)?.forEach(l => l());
        }
      );

      return () => {
        listeners.get(cacheKey)?.delete(callback);
        unsubscribe();
      };
    },
    () => {
        if (!targetRefOrQuery) return { value: undefined, loading: false, error: undefined };
        const cacheKey = getCacheKey(targetRefOrQuery);
        return cache.get(cacheKey) ?? { value: undefined, loading: true, error: undefined };
    },
     () => ({ value: undefined, loading: true, error: undefined })
  );

  return [store.value, store.loading, store.error];
};
