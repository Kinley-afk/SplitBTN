// All Firestore calls for expenses live here, not in screens.
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

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
// object can be passed between screens safely.
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

export function addExpense(groupId, data, uid) {
  return addDoc(expensesCollection(groupId), {
    ...buildPayload(data),
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// createdBy and createdAt are never sent, so they cannot be changed.
export function updateExpense(groupId, expenseId, data) {
  return updateDoc(doc(db, 'groups', groupId, 'expenses', expenseId), {
    ...buildPayload(data),
    updatedAt: serverTimestamp(),
  });
}

export function deleteExpense(groupId, expenseId) {
  return deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseId));
}

// Real-time listener. Newest expense date first. Returns an unsubscribe function.
export function subscribeToExpenses(groupId, onData, onError) {
  return onSnapshot(
    expensesCollection(groupId),
    (snapshot) => {
      const expenses = snapshot.docs.map(toExpense);
      expenses.sort((a, b) => b.dateMs - a.dateMs || b.createdAtMs - a.createdAtMs);
      onData(expenses);
    },
    onError
  );
}