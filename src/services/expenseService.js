// All Firestore calls for expenses live here, not in screens.
// Writes use writeWithOfflineSupport, so saving never hangs when offline.
// An expense and its receipt photo are always written together in one batch.
import {
  collection, doc, writeBatch, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { listenWithCache } from './cachedListener';
import { writeWithOfflineSupport } from './offlineWrite';

const expensesCollection = (groupId) => collection(db, 'groups', groupId, 'expenses');
// The receipt document has the same id as its expense.
const receiptRef = (groupId, expenseId) => doc(db, 'groups', groupId, 'receipts', expenseId);

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
    hasReceipt: Boolean(data.hasReceipt),
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

// The write functions return 'synced' or 'queued' (saved on the phone, will sync).

// receiptBase64: JPEG text, or null for no receipt.
export function addExpense(groupId, data, uid, receiptBase64 = null) {
  const expenseRef = doc(expensesCollection(groupId)); // id generated locally
  const batch = writeBatch(db);
  batch.set(expenseRef, {
    ...buildPayload(data),
    hasReceipt: Boolean(receiptBase64),
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (receiptBase64) {
    batch.set(receiptRef(groupId, expenseRef.id), {
      image: receiptBase64, createdBy: uid, createdAt: serverTimestamp(),
    });
  }
  return writeWithOfflineSupport(batch.commit());
}

// receiptChange: undefined = leave the receipt alone,
//                a string  = attach or replace it with this photo,
//                null      = remove it.
// createdBy and createdAt are never sent for the expense, so they cannot be changed.
export function updateExpense(groupId, expenseId, data, uid, receiptChange) {
  const batch = writeBatch(db);
  const changes = { ...buildPayload(data), updatedAt: serverTimestamp() };

  if (typeof receiptChange === 'string') {
    changes.hasReceipt = true;
    batch.set(receiptRef(groupId, expenseId), {
      image: receiptChange, createdBy: uid, createdAt: serverTimestamp(),
    });
  } else if (receiptChange === null) {
    changes.hasReceipt = false;
    batch.delete(receiptRef(groupId, expenseId));
  }

  batch.update(doc(db, 'groups', groupId, 'expenses', expenseId), changes);
  return writeWithOfflineSupport(batch.commit());
}

// hasReceipt: the receipt document is only deleted if it exists
// (the security rules cannot delete a document that is not there).
export function deleteExpense(groupId, expenseId, hasReceipt = false) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'groups', groupId, 'expenses', expenseId));
  if (hasReceipt) batch.delete(receiptRef(groupId, expenseId));
  return writeWithOfflineSupport(batch.commit());
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