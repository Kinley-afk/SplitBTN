// Shares the logged-in user with every screen.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true until Firebase has restored the saved session from AsyncStorage
  const [initializing, setInitializing] = useState(true);
  const [, setVersion] = useState(0);

  useEffect(() => {
    // Firebase calls this on startup and on every login/logout.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return unsubscribe; // listener cleanup
  }, []);

  // Firebase mutates the same user object when the name changes,
  // so we bump a counter to force screens to re-render.
  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
      setVersion((v) => v + 1);
    }
  };

  return (
    <AuthContext.Provider value={{ user, initializing, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);