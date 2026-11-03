// All Firestore calls for in-app notifications live here, not in screens.
import {
  collection, doc, onSnapshot, updateDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const notificationsCollection = (uid) => collection(db, 'users', uid, 'notifications');

// Writes one notification per recipient in a single batch.
// Never throws: a failed notification must not break saving an expense or payment.
// Returns true if it was sent, false if it failed.
export async function notifyMembers({ groupId, recipientIds, fromUid, type, title, body }) {
  const recipients = Array.from(new Set(recipientIds)).filter((uid) => uid !== fromUid);
  if (recipients.length === 0) return true;
  try {
    const batch = writeBatch(db);
    recipients.forEach((uid) => {
      batch.set(doc(notificationsCollection(uid)), {
        type, title, body, groupId, fromUid, read: false, createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.warn('Could not send notification:', error.message);
    return false;
  }
}

function toNotification(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    type: data.type,
    title: data.title,
    body: data.body,
    groupId: data.groupId,
    fromUid: data.fromUid,
    read: Boolean(data.read),
    // A just-written record has no server timestamp yet, so use "now".
    createdAtMs: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
  };
}

// Live listener on the user's own notifications. Newest first.
// onData(list, newOnes): newOnes are notifications that arrived since the last snapshot.
// Returns an unsubscribe function.
export function subscribeToNotifications(uid, onData, onError) {
  return onSnapshot(
    notificationsCollection(uid),
    (snapshot) => {
      const list = snapshot.docs.map(toNotification).sort((a, b) => b.createdAtMs - a.createdAtMs);
      const newOnes = snapshot
        .docChanges()
        .filter((change) => change.type === 'added')
        .map((change) => toNotification(change.doc));
      onData(list, newOnes);
    },
    onError
  );
}

export function markAsRead(uid, notificationId) {
  return updateDoc(doc(db, 'users', uid, 'notifications', notificationId), { read: true });
}

export async function markAllAsRead(uid, notifications) {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(db, 'users', uid, 'notifications', n.id), { read: true }));
  await batch.commit();
}