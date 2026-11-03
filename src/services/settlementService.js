// All Firestore calls for settlement payments live here, not in screens.
import {
  collection, doc, addDoc, deleteDoc, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const settlementsCollection = (groupId) => collection(db, 'groups', groupId, 'settlements');

export function getFriendlySettlementError(error) {
  switch (error?.code) {
    case 'permission-denied': return 'You do not have permission to do that.';
    case 'unavailable': return 'No internet connection. Please try again.';
    default: return 'Something went wrong. Please try again.';
  }
}

// Records that `fromUid` paid `data.to` the given amount (in Nu.).
export function addSettlement(groupId, data, fromUid) {
  return addDoc(settlementsCollection(groupId), {
    from: fromUid,
    to: data.to,
    amount: data.amount,
    date: Timestamp.now(),
    createdBy: fromUid,
    createdAt: serverTimestamp(),
  });
}

export function deleteSettlement(groupId, settlementId) {
  return deleteDoc(doc(db, 'groups', groupId, 'settlements', settlementId));
}

// Real-time listener. Newest payment first. Returns an unsubscribe function.
export function subscribeToSettlements(groupId, onData, onError) {
  return onSnapshot(
    settlementsCollection(groupId),
    (snapshot) => {
      const settlements = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          from: data.from,
          to: data.to,
          amount: data.amount,
          dateMs: data.date?.toMillis ? data.date.toMillis() : 0,
          createdBy: data.createdBy,
        };
      });
      settlements.sort((a, b) => b.dateMs - a.dateMs);
      onData(settlements);
    },
    onError
  );
}