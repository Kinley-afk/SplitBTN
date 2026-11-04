// All Firestore calls for expenses live here, not in screens.
// Writes use writeWithOfflineSupport, so saving never hangs when offline.
import {
  collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { listenWithCache } from './cachedListener';
import { writeWithOfflineSupport } from './offlineWrite';

const expensesCollection = (groupId) => collection(db, 'groups', groupId, 'expenses');

export function getFriendlyExpenseError(error) {
  switch (error?.code) {
    case 'permission-denied': return 'You do not have permission to do that.';
    case 'unavailable': return 'No internet connection. Please try again.';
    case 'not-found': return 'This expense no longer exists.';
    default: return 'Something went wrong. Please try again.';
  }
}

// Firestore document -> plain object. Timestamps become milliseconds so the
// object can be passed between screens and saved on the phone safely.
function toExpense(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    amount: data.amount,
    category: data.category,
    dateMs: data.date?.toMillis ? data.date.toMillis() : 0,
    paidBy: data.paidBy,
    participantIds: data.participantIds || [],
    splitMethod: data.splitMethod,
    shares: data.shares || {},
    percentages: data.percentages || {},
    createdBy: data.createdBy,
    // A just-saved expense has no server timestamp yet, so treat it as newest.
    createdAtMs: data.createdAt?.toMillis ? data.createdAt.toMillis() : Number.MAX_SAFE_INTEGER,
  };
}

// The fields the form controls (the same for add and edit).
function buildPayload(data) {
  return {
    title: data.title,
    amount: data.amount,
    category: data.category,
    date: Timestamp.fromDate(data.date),
    paidBy: data.paidBy,
    participantIds: data.participantIds,
    splitMethod: data.splitMethod,
    shares: data.shares,
    percentages: data.percentages,
  };
}

// The three write functions return 'synced' or 'queued' (saved on the phone, will sync).
export function addExpense(groupId, data, uid) {
  return writeWithOfflineSupport(
    addDoc(expensesCollection(groupId), {
      ...buildPayload(data),
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
}

// createdBy and createdAt are never sent, so they cannot be changed.
export function updateExpense(groupId, expenseId, data) {
  return writeWithOfflineSupport(
    updateDoc(doc(db, 'groups', groupId, 'expenses', expenseId), {
      ...buildPayload(data),
      updatedAt: serverTimestamp(),
    })
  );
}

export function deleteExpense(groupId, expenseId) {
  return writeWithOfflineSupport(deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseId)));
}

// Real-time listener. Newest expense date first. Shows saved data first
// (works offline after a restart). Returns an unsubscribe function.
export function subscribeToExpenses(groupId, onData, onError) {
  return listenWithCache(
    expensesCollection(groupId),
    `expenses:${groupId}`,
    (snapshot) =>
      snapshot.docs.map(toExpense).sort((a, b) => b.dateMs - a.dateMs || b.createdAtMs - a.createdAtMs),
    onData,
    onError
  );
}