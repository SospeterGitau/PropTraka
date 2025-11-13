"use client"; // Client component

import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { firestore } from '../index';
import { useSyncExternalStore } from 'react';

// A basic in-memory cache to store results.
const cache = new Map<string, any>();
const listeners = new Map<string, Set<() => void>>();

function getCacheKey(target: string | DocumentReference): string {
  return typeof target === 'string' ? target : target.path;
}

export const useDoc = <T>(
  targetRefOrPath: string | DocumentReference | null
): [T | null | undefined, boolean, Error | undefined] => {

  const store = useSyncExternalStore(
    (callback) => {
      if (!targetRefOrPath) {
        return () => {};
      }

      const cacheKey = getCacheKey(targetRefOrPath);
      if (!listeners.has(cacheKey)) {
        listeners.set(cacheKey, new Set());
      }
      listeners.get(cacheKey)!.add(callback);

      const docRef = typeof targetRefOrPath === 'string' ? doc(firestore, targetRefOrPath) : targetRefOrPath;

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          const data = snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as T) : null;
          cache.set(cacheKey, { value: data, loading: false, error: undefined });
          listeners.get(cacheKey)?.forEach(l => l());
        },
        (err) => {
          console.error('Error in useDoc:', err);
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
        if (!targetRefOrPath) return { value: undefined, loading: false, error: undefined };
        const cacheKey = getCacheKey(targetRefOrPath);
        return cache.get(cacheKey) ?? { value: undefined, loading: true, error: undefined };
    },
    () => ({ value: undefined, loading: true, error: undefined })
  );

  return [store.value, store.loading, store.error];
};
