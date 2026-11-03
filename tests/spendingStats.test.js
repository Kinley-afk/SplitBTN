// Unit tests for the spending statistics. Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCategoryTotals } from '../src/utils/spendingStats.js';

test('no expenses gives an empty result', () => {
  assert.deepEqual(calculateCategoryTotals([]), { total: 0, categories: [] });
});

test('totals and percentages per category, largest first', () => {
  const expenses = [
    { category: 'Food', amount: 100 },
    { category: 'Rent', amount: 300 },
    { category: 'Food', amount: 100 },
  ];
  const result = calculateCategoryTotals(expenses);
  assert.equal(result.total, 500);
  assert.deepEqual(result.categories, [
    { category: 'Rent', amount: 300, percent: 60 },
    { category: 'Food', amount: 200, percent: 40 },
  ]);
});

test('unknown or missing categories are counted under Other', () => {
  const expenses = [
    { category: 'Food', amount: 50 },
    { category: 'Pets', amount: 25 },
    { amount: 25 },
  ];
  const result = calculateCategoryTotals(expenses);
  const other = result.categories.find((c) => c.category === 'Other');
  assert.equal(other.amount, 50);
  assert.equal(result.total, 100);
});

test('category amounts always add up to the total (no drift)', () => {
  const expenses = [
    { category: 'Food', amount: 0.1 },
    { category: 'Food', amount: 0.2 },
    { category: 'Transport', amount: 33.33 },
    { category: 'Health', amount: 66.67 },
  ];
  const result = calculateCategoryTotals(expenses);
  const sum = result.categories.reduce((s, c) => s + Math.round(c.amount * 100), 0);
  assert.equal(sum, Math.round(result.total * 100));
  assert.equal(result.total, 100.3);
});

test('categories with the same amount are ordered by name', () => {
  const result = calculateCategoryTotals([
    { category: 'Shopping', amount: 10 },
    { category: 'Health', amount: 10 },
  ]);
  assert.deepEqual(result.categories.map((c) => c.category), ['Health', 'Shopping']);
});