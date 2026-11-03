// Spending statistics: pure functions with no React or Firebase code,
// tested in tests/spendingStats.test.js.
import { toChetrum, fromChetrum } from './splitCalculator.js';

const KNOWN_CATEGORIES = [
  'Food', 'Groceries', 'Rent', 'Utilities', 'Transport',
  'Entertainment', 'Shopping', 'Health', 'Other',
];

// Returns { total, categories: [{ category, amount, percent }] }.
// Categories are sorted largest first. Categories with no spending are left out.
// Unknown or missing categories are counted under "Other".
export function calculateCategoryTotals(expenses) {
  const chetrumByCategory = {};
  let totalChetrum = 0;

  expenses.forEach((expense) => {
    const category = KNOWN_CATEGORIES.includes(expense.category) ? expense.category : 'Other';
    const chetrum = toChetrum(expense.amount);
    chetrumByCategory[category] = (chetrumByCategory[category] || 0) + chetrum;
    totalChetrum += chetrum;
  });

  const categories = Object.keys(chetrumByCategory)
    .map((category) => ({
      category,
      amount: fromChetrum(chetrumByCategory[category]),
      // one decimal place, e.g. 33.3
      percent: totalChetrum === 0
        ? 0
        : Math.round((chetrumByCategory[category] / totalChetrum) * 1000) / 10,
    }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));

  return { total: fromChetrum(totalChetrum), categories };
}