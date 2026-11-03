// All Firestore calls for groups live here, not in screens.
import {
  collection, doc, getDoc, getDocs, query, where, onSnapshot,
  updateDoc, arrayUnion, arrayRemove, runTransaction, writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// No 0/O/1/I so codes are easy to read aloud and type.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

// Math.random is fine here: the code is an invitation, not a password.
// Real protection comes from the Firestore rules.
function generateInviteCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return code;
}

// Converts errors into messages a normal user understands.
export function getFriendlyGroupError(error) {
  switch (error?.message) {
    case 'INVALID_CODE': return 'That invite code does not exist.';
    case 'ALREADY_MEMBER': return 'You are already a member of this group.';
    case 'CODE_GENERATION_FAILED': return 'Could not create a unique invite code. Please try again.';
  }
  switch (error?.code) {
    case 'not-found': return 'This group no longer exists.';
    case 'permission-denied': return 'You do not have permission to do that.';
    case 'unavailable': return 'No internet connection. Please try again.';
    default: return 'Something went wrong. Please try again.';
  }
}

// Creates a group and claims a unique invite code in ONE transaction,
// so two groups can never end up with the same code.
export async function createGroup(name, user) {
  const groupRef = doc(collection(db, 'groups')); // id generated locally
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const inviteRef = doc(db, 'inviteCodes', code);
    try {
      await runTransaction(db, async (transaction) => {
        const existing = await transaction.get(inviteRef);
        if (existing.exists()) throw new Error('CODE_TAKEN');
        transaction.set(groupRef, {
          name: name.trim(),
          inviteCode: code,
          createdBy: user.uid,
          memberIds: [user.uid],
          createdAt: serverTimestamp(),
        });
        transaction.set(inviteRef, { groupId: groupRef.id, createdBy: user.uid });
      });
      return groupRef.id;
    } catch (error) {
      if (error.message !== 'CODE_TAKEN') throw error; // real error: stop
      // code collision: loop and try a new code
    }
  }
  throw new Error('CODE_GENERATION_FAILED');
}

// Joins a group using an invite code.
export async function joinGroupByCode(rawCode, uid) {
  const code = rawCode.trim().toUpperCase();

  // 1. Code -> group id (non-members cannot read the group itself).
  const inviteSnap = await getDoc(doc(db, 'inviteCodes', code));
  if (!inviteSnap.exists()) throw new Error('INVALID_CODE');
  const { groupId } = inviteSnap.data();

  // 2. Already a member? (query only returns groups we are allowed to read)
  const mine = await getDocs(
    query(collection(db, 'groups'), where('memberIds', 'array-contains', uid))
  );
  if (mine.docs.some((d) => d.id === groupId)) throw new Error('ALREADY_MEMBER');

  // 3. Add ourselves. The security rules allow only "add myself".
  await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayUnion(uid) });
  return groupId;
}

// Removes the user from the group. If they are the last member,
// the group and its invite code are deleted together.
export async function leaveGroup(groupId, uid) {
  const groupRef = doc(db, 'groups', groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return;

  const { memberIds, inviteCode } = snap.data();
  if (memberIds.length <= 1) {
    const batch = writeBatch(db);
    batch.delete(groupRef);
    batch.delete(doc(db, 'inviteCodes', inviteCode));
    await batch.commit();
  } else {
    await updateDoc(groupRef, { memberIds: arrayRemove(uid) });
  }
}

// Real-time listener for every group the user belongs to.
// Returns an unsubscribe function (call it to stop listening).
export function subscribeToUserGroups(uid, onData, onError) {
  const groupsQuery = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid));
  return onSnapshot(
    groupsQuery,
    (snapshot) => {
      const groups = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Newest first. A just-created group has no server timestamp yet, so treat it as newest.
      const time = (g) => (g.createdAt?.toMillis ? g.createdAt.toMillis() : Number.MAX_SAFE_INTEGER);
      groups.sort((a, b) => time(b) - time(a));
      onData(groups);
    },
    onError
  );
}

// Loads display names for a list of user ids. Returns { uid: { displayName, email } }.
// A missing profile falls back to "Member" instead of crashing.
export async function getUserProfiles(uids) {
  const entries = await Promise.all(
    uids.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        return [uid, snap.exists() ? snap.data() : { displayName: 'Member' }];
      } catch (error) {
        return [uid, { displayName: 'Member' }];
      }
    })
  );
  return Object.fromEntries(entries);
}