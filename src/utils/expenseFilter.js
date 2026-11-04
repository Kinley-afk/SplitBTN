// Search and filter for the expense history: pure functions with no React or
// Firebase code, tested in tests/expenseFilter.test.js.
import { toChetrum, fromChetrum } from './splitCalculator.js';

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

// filters: { query, categories: [], paidBy, fromDate, toDate }  (dates are Date objects or null)
// nameOf(uid) gives the payer's display name so the search box can match it.
// Every filter that is set must match (AND).
export function filterExpenses(expenses, filters = {}, nameOf = () => '') {
  const words = (filters.query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const categories = filters.categories || [];
  const fromMs = filters.fromDate ? startOfDay(filters.fromDate) : null;
  const toMs = filters.toDate ? endOfDay(filters.toDate) : null;

  return expenses.filter((expense) => {
    if (categories.length > 0 && !categories.includes(expense.category)) return false;
    if (filters.paidBy && expense.paidBy !== filters.paidBy) return false;
    if (fromMs !== null && expense.dateMs < fromMs) return false;
    if (toMs !== null && expense.dateMs > toMs) return false;

    if (words.length > 0) {
      const haystack =
        `${expense.title} ${expense.category} ${nameOf(expense.paidBy)} ${expense.amount}`.toLowerCase();
      // Every typed word must appear somewhere in the expense.
      if (!words.every((word) => haystack.includes(word))) return false;
    }
    return true;
  });
}

// Adds amounts in whole chetrum so the total never drifts. Returns Nu.
export function sumExpenses(expenses) {
  return fromChetrum(expenses.reduce((sum, expense) => sum + toChetrum(expense.amount), 0));
}

// How many filters are switched on (used for the "Filters (2)" label).
export function countActiveFilters(filters = {}) {
  let count = 0;
  if ((filters.query || '').trim()) count += 1;
  if ((filters.categories || []).length > 0) count += 1;
  if (filters.paidBy) count += 1;
  if (filters.fromDate) count += 1;
  if (filters.toDate) count += 1;
  return count;
}