import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

export const firestoreHelpers = {
  // Generic collection reference
  getCollection: (collectionName: string) => collection(db, collectionName),

  // Add document
  addDocument: async (collectionName: string, data: any) => {
    return await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
    });
  },

  // Update document
  updateDocument: async (collectionName: string, docId: string, data: any) => {
    const docRef = doc(db, collectionName, docId);
    return await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete document
  deleteDocument: async (collectionName: string, docId: string) => {
    const docRef = doc(db, collectionName, docId);
    return await deleteDoc(docRef);
  },

  // Query with constraints
  queryCollection: (collectionName: string, ...constraints: QueryConstraint[]) => {
    return query(collection(db, collectionName), ...constraints);
  },

  // Timestamp helpers
  timestamp: Timestamp,
  now: () => Timestamp.now(),
  fromDate: (date: Date) => Timestamp.fromDate(date),
};

export { collection, doc, query, where, orderBy, onSnapshot, Timestamp };
