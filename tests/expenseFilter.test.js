// Unit tests for expense search and filter. Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterExpenses, sumExpenses, countActiveFilters } from '../src/utils/expenseFilter.js';

const noon = (month, day) => new Date(2026, month - 1, day, 12, 0, 0).getTime();

const expenses = [
  { id: '1', title: 'Dinner at Zhemgang', category: 'Food', paidBy: 'ram', amount: 100, dateMs: noon(10, 19) },
  { id: '2', title: 'Rent', category: 'Rent', paidBy: 'sonam', amount: 3000, dateMs: noon(10, 20) },
  { id: '3', title: 'Taxi home', category: 'Transport', paidBy: 'ram', amount: 150.5, dateMs: noon(10, 21) },
  { id: '4', title: 'Groceries', category: 'Groceries', paidBy: 'sonam', amount: 800, dateMs: noon(10, 22) },
];
const names = { ram: 'Ram', sonam: 'Sonam' };
const nameOf = (uid) => names[uid] || '';
const ids = (list) => list.map((e) => e.id);

test('no filters returns every expense', () => {
  assert.deepEqual(ids(filterExpenses(expenses, {}, nameOf)), ['1', '2', '3', '4']);
});

test('text search ignores capital letters and matches the title', () => {
  assert.deepEqual(ids(filterExpenses(expenses, { query: 'DINNER' }, nameOf)), ['1']);
});

test('text search also matches payer name, category and amount', () => {
  assert.deepEqual(ids(filterExpenses(expenses, { query: 'sonam' }, nameOf)), ['2', '4']);
  assert.deepEqual(ids(filterExpenses(expenses, { query: 'transport' }, nameOf)), ['3']);
  assert.deepEqual(ids(filterExpenses(expenses, { query: '150.5' }, nameOf)), ['3']);
});

test('every typed word must match', () => {
  assert.deepEqual(ids(filterExpenses(expenses, { query: 'dinner ram' }, nameOf)), ['1']);
  assert.deepEqual(ids(filterExpenses(expenses, { query: 'dinner sonam' }, nameOf)), []);
});

test('category filter accepts several categories', () => {
  const result = filterExpenses(expenses, { categories: ['Food', 'Rent'] }, nameOf);
  assert.deepEqual(ids(result), ['1', '2']);
});

test('payer filter', () => {
  assert.deepEqual(ids(filterExpenses(expenses, { paidBy: 'ram' }, nameOf)), ['1', '3']);
});

test('date range includes both the first and the last day', () => {
  const filters = { fromDate: new Date(2026, 9, 20, 12), toDate: new Date(2026, 9, 21, 12) };
  assert.deepEqual(ids(filterExpenses(expenses, filters, nameOf)), ['2', '3']);
});

test('filters combine: all of them must match', () => {
  const filters = { paidBy: 'ram', categories: ['Transport'], query: 'taxi' };
  assert.deepEqual(ids(filterExpenses(expenses, filters, nameOf)), ['3']);
});

test('sumExpenses adds exactly with no floating point drift', () => {
  assert.equal(sumExpenses([{ amount: 0.1 }, { amount: 0.2 }]), 0.3);
  assert.equal(sumExpenses([]), 0);
});

test('countActiveFilters counts only the filters that are switched on', () => {
  assert.equal(countActiveFilters({}), 0);
  assert.equal(countActiveFilters({ query: '   ' }), 0);
  assert.equal(countActiveFilters({ query: 'a', categories: ['Food'], paidBy: '', fromDate: null }), 2);
});