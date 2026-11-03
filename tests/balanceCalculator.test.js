// Unit tests for the balance calculator. Run with:
//   node --test tests/balanceCalculator.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBalances } from '../src/utils/balanceCalculator.js';

test('no expenses gives no balances and no transfers', () => {
  const result = calculateBalances([], []);
  assert.deepEqual(result.balances, {});
  assert.deepEqual(result.transfers, []);
  assert.equal(result.isBalanced, true);
});

test('A pays Nu. 100 split equally with B: B owes A 50', () => {
  const expenses = [{ paidBy: 'a', amount: 100, shares: { a: 50, b: 50 } }];
  const result = calculateBalances(expenses);
  assert.deepEqual(result.balances, { a: 50, b: -50 });
  assert.deepEqual(result.transfers, [{ from: 'b', to: 'a', amount: 50 }]);
});

test('payer who is not a participant is owed the full amount', () => {
  const expenses = [{ paidBy: 'a', amount: 90, shares: { b: 45, c: 45 } }];
  const result = calculateBalances(expenses);
  assert.deepEqual(result.balances, { a: 90, b: -45, c: -45 });
});

test('uneven rounding (33.34 / 33.33 / 33.33) still sums to zero', () => {
  const expenses = [{ paidBy: 'a', amount: 100, shares: { a: 33.34, b: 33.33, c: 33.33 } }];
  const result = calculateBalances(expenses);
  assert.deepEqual(result.balances, { a: 66.66, b: -33.33, c: -33.33 });
  assert.equal(result.isBalanced, true);
});

test('a full settlement clears the debt', () => {
  const expenses = [{ paidBy: 'a', amount: 100, shares: { a: 50, b: 50 } }];
  const settlements = [{ from: 'b', to: 'a', amount: 50 }];
  const result = calculateBalances(expenses, settlements);
  assert.deepEqual(result.balances, { a: 0, b: 0 });
  assert.deepEqual(result.transfers, []);
});

test('overpaying a debt reverses the direction', () => {
  const expenses = [{ paidBy: 'a', amount: 100, shares: { a: 50, b: 50 } }];
  const settlements = [{ from: 'b', to: 'a', amount: 80 }];
  const result = calculateBalances(expenses, settlements);
  assert.deepEqual(result.balances, { a: -30, b: 30 });
  assert.deepEqual(result.transfers, [{ from: 'a', to: 'b', amount: 30 }]);
});

test('debts are simplified: A paid for B, B paid for C -> C pays A once', () => {
  const expenses = [
    { paidBy: 'a', amount: 10, shares: { b: 10 } },
    { paidBy: 'b', amount: 10, shares: { c: 10 } },
  ];
  const result = calculateBalances(expenses);
  assert.deepEqual(result.transfers, [{ from: 'c', to: 'a', amount: 10 }]);
});

test('5 people: at most 4 transfers, and paying them clears everyone', () => {
  const expenses = [
    { paidBy: 'a', amount: 100, shares: { a: 20, b: 20, c: 20, d: 20, e: 20 } },
    { paidBy: 'b', amount: 60, shares: { a: 10, c: 20, e: 30 } },
    { paidBy: 'c', amount: 45.5, shares: { b: 15.5, d: 30 } },
    { paidBy: 'e', amount: 200, shares: { a: 40, b: 40, c: 40, d: 40, e: 40 } },
  ];
  const result = calculateBalances(expenses);
  assert.equal(result.isBalanced, true);
  assert.ok(result.transfers.length <= 4, `got ${result.transfers.length} transfers`);

  // Recording every suggested transfer as a settlement must zero all balances.
  const after = calculateBalances(expenses, result.transfers);
  Object.values(after.balances).forEach((value) => assert.ok(value === 0));
});

test('corrupted data (shares not matching amount) is flagged', () => {
  const expenses = [{ paidBy: 'a', amount: 100, shares: { a: 50 } }];
  const result = calculateBalances(expenses);
  assert.equal(result.isBalanced, false);
  assert.equal(result.totalDrift, 50);
});