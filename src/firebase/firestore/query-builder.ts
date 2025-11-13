
import { collection, query, where, Query, DocumentData, QueryConstraint } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

/**
 * Creates a Firestore query automatically filtered by ownerId
 * Additional query constraints can be passed as rest parameters
 * 
 * @param firestore - Firestore instance
 * @param collectionName - Name of the collection to query
 * @param userId - User ID to filter by (the ownerId field)
 * @param additionalConstraints - Optional additional query constraints (where, orderBy, limit, etc.)
 * @returns A Firestore Query object filtered by ownerId
 */
export function createUserQuery(
  firestore: Firestore,
  collectionName: string,
  userId: string,
  ...additionalConstraints: QueryConstraint[]
): Query<DocumentData> {
  return query(
    collection(firestore, collectionName),
    where('ownerId', '==', userId),
    ...additionalConstraints
  );
}
