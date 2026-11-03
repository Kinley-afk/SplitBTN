// Live totals across ALL of the user's groups, for the Home dashboard.
// It listens to every group's expenses and settlements, runs the tested
// balance calculator per group, and adds up the user's own balances.
import { useEffect, useMemo, useState } from 'react';
import { subscribeToExpenses } from '../services/expenseService';
import { subscribeToSettlements } from '../services/settlementService';
import { calculateBalances } from '../utils/balanceCalculator';
import { toChetrum, fromChetrum } from '../utils/splitCalculator';

const RECENT_LIMIT = 5;

export default function useAllGroupsSummary(groups, uid) {
  // { groupId: { expenses, settlements } } (a key is missing until its first data arrives)
  const [data, setData] = useState({});
  const [error, setError] = useState('');

  // Re-subscribe only when the SET of groups changes, not on every render.
  const idsKey = groups.map((g) => g.id).sort().join(',');

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : [];
    setData({});
    setError('');
    const unsubscribers = [];

    ids.forEach((groupId) => {
      const patch = (changes) =>
        setData((current) => ({ ...current, [groupId]: { ...(current[groupId] || {}), ...changes } }));
      const onError = (err) => {
        console.warn('Home listener error:', err.message);
        setError('Some totals could not be loaded. Check your connection.');
      };
      unsubscribers.push(subscribeToExpenses(groupId, (expenses) => patch({ expenses }), onError));
      unsubscribers.push(subscribeToSettlements(groupId, (settlements) => patch({ settlements }), onError));
    });

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe()); // listener cleanup
  }, [idsKey]);

  const loading = groups.some((g) => !data[g.id]?.expenses || !data[g.id]?.settlements);

  const summary = useMemo(() => {
    let owedChetrum = 0; // groups owe me
    let oweChetrum = 0;  // I owe groups
    const allExpenses = [];

    groups.forEach((group) => {
      const groupData = data[group.id];
      if (!groupData?.expenses || !groupData?.settlements) return;

      const { balances } = calculateBalances(groupData.expenses, groupData.settlements);
      const mine = toChetrum(balances[uid] || 0);
      if (mine > 0) owedChetrum += mine;
      else oweChetrum += -mine;

      groupData.expenses.forEach((expense) =>
        allExpenses.push({ ...expense, groupId: group.id, groupName: group.name })
      );
    });

    allExpenses.sort((a, b) => b.dateMs - a.dateMs || b.createdAtMs - a.createdAtMs);

    return {
      youAreOwed: fromChetrum(owedChetrum),
      youOwe: fromChetrum(oweChetrum),
      netBalance: fromChetrum(owedChetrum - oweChetrum),
      recentExpenses: allExpenses.slice(0, RECENT_LIMIT),
    };
  }, [data, groups, uid]);

  return { ...summary, loading, error };
}