// One shared live listener for the user's groups, used by Home and Groups screens.
// It starts when someone logs in and stops (cleanup) when they log out.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToUserGroups } from '../services/groupService';

const GroupsContext = createContext({ groups: [], loading: true, error: '' });

export function GroupsProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) {
      setGroups([]);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const unsubscribe = subscribeToUserGroups(
      uid,
      (data) => { setGroups(data); setLoading(false); },
      (err) => {
        console.warn('Groups listener error:', err.message);
        setError('Could not load your groups. Check your connection.');
        setLoading(false);
      }
    );
    return unsubscribe; // listener cleanup
  }, [uid]);

  return (
    <GroupsContext.Provider value={{ groups, loading, error }}>
      {children}
    </GroupsContext.Provider>
  );
}

export const useGroups = () => useContext(GroupsContext);