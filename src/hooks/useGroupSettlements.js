// Live list of one group's settlement payments. Stops listening when the screen closes.
import { useEffect, useState } from 'react';
import { subscribeToSettlements } from '../services/settlementService';

export default function useGroupSettlements(groupId) {
  const [state, setState] = useState({ settlements: [], loading: true, error: '' });

  useEffect(() => {
    setState({ settlements: [], loading: true, error: '' });
    const unsubscribe = subscribeToSettlements(
      groupId,
      (settlements) => setState({ settlements, loading: false, error: '' }),
      (err) => {
        console.warn('Settlements listener error:', err.message);
        setState({ settlements: [], loading: false, error: 'Could not load payments. Check your connection.' });
      }
    );
    return unsubscribe; // listener cleanup
  }, [groupId]);

  return state;
}