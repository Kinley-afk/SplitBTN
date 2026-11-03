// Live list of one group's expenses. Stops listening when the screen closes.
import { useEffect, useState } from 'react';
import { subscribeToExpenses } from '../services/expenseService';

export default function useGroupExpenses(groupId) {
  const [state, setState] = useState({ expenses: [], loading: true, error: '' });

  useEffect(() => {
    setState({ expenses: [], loading: true, error: '' });
    const unsubscribe = subscribeToExpenses(
      groupId,
      (expenses) => setState({ expenses, loading: false, error: '' }),
      (err) => {
        console.warn('Expenses listener error:', err.message);
        setState({ expenses: [], loading: false, error: 'Could not load expenses. Check your connection.' });
      }
    );
    return unsubscribe; // listener cleanup
  }, [groupId]);

  return state;
}