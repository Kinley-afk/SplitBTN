// Combines live expenses + live settlements and runs the tested balance
// calculator. Nothing is stored: balances are recomputed on every change.
import { useMemo } from 'react';
import useGroupExpenses from './useGroupExpenses';
import useGroupSettlements from './useGroupSettlements';
import { calculateBalances } from '../utils/balanceCalculator';

export default function useGroupBalances(groupId) {
  const expenseState = useGroupExpenses(groupId);
  const settlementState = useGroupSettlements(groupId);

  const result = useMemo(
    () => calculateBalances(expenseState.expenses, settlementState.settlements),
    [expenseState.expenses, settlementState.settlements]
  );

  return {
    ...result, // balances, transfers, totalDrift, isBalanced
    expenses: expenseState.expenses,
    settlements: settlementState.settlements,
    loading: expenseState.loading || settlementState.loading,
    error: expenseState.error || settlementState.error,
  };
}