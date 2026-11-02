// All Firebase Authentication calls live here, not in screens.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// Turns Firebase error codes into messages a normal user understands.
export function getFriendlyAuthError(error) {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'No internet connection. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export async function registerUser(name, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(credential.user, { displayName: name.trim() });

  // Public profile document, used later to show group member names.
  // If this fails the account still exists, so we do not block registration.
  try {
    await setDoc(doc(db, 'users', credential.user.uid), {
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Could not save user profile document:', error.message);
  }
  return credential.user;
}

export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function logoutUser() {
  return signOut(auth);
}