// Unit tests for the split calculator. Run with:
//   node --test tests/splitCalculator.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSplit, parseMoney, sumShares } from '../src/utils/splitCalculator.js';

test('parseMoney accepts valid amounts and rejects invalid ones', () => {
  assert.equal(parseMoney('100'), 100);
  assert.equal(parseMoney('1,250.50'), 1250.5);
  assert.equal(parseMoney(' 7.5 '), 7.5);
  assert.ok(Number.isNaN(parseMoney('')));
  assert.ok(Number.isNaN(parseMoney('abc')));
  assert.ok(Number.isNaN(parseMoney('-5')));
  assert.ok(Number.isNaN(parseMoney('10.555')));
});

test('equal split: Nu. 100 among 3 gives 33.34 / 33.33 / 33.33', () => {
  const result = calculateSplit('equal', 100, ['a', 'b', 'c']);
  assert.equal(result.ok, true);
  assert.deepEqual(result.shares, { a: 33.34, b: 33.33, c: 33.33 });
  assert.equal(sumShares(result.shares), 100);
});

test('equal split divides evenly when possible', () => {
  const result = calculateSplit('equal', 10, ['a', 'b', 'c', 'd']);
  assert.deepEqual(result.shares, { a: 2.5, b: 2.5, c: 2.5, d: 2.5 });
});

test('equal split of Nu. 0.05 between 2 people keeps every chetrum', () => {
  const result = calculateSplit('equal', '0.05', ['a', 'b']);
  assert.deepEqual(result.shares, { a: 0.03, b: 0.02 });
});

test('equal split always reconciles with the total', () => {
  const amounts = [0.01, 0.99, 1, 99.99, 333.33, 1234.56, 10000000];
  for (const amount of amounts) {
    for (let people = 1; people <= 7; people++) {
      const ids = Array.from({ length: people }, (_, i) => `u${i}`);
      const result = calculateSplit('equal', amount, ids);
      assert.equal(result.ok, true);
      assert.equal(sumShares(result.shares), amount, `${amount} among ${people}`);
    }
  }
});

test('exact split accepts amounts that add up to the total', () => {
  const result = calculateSplit('exact', 100, ['a', 'b'], { a: '60', b: '40' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.shares, { a: 60, b: 40 });
});

test('exact split rejects amounts that do not add up', () => {
  const result = calculateSplit('exact', 100, ['a', 'b'], { a: '60', b: '30' });
  assert.equal(result.ok, false);
  assert.match(result.error, /90\.00/);
});

test('exact split rejects a blank or invalid amount', () => {
  assert.equal(calculateSplit('exact', 100, ['a', 'b'], { a: '100' }).ok, false);
  assert.equal(calculateSplit('exact', 100, ['a', 'b'], { a: '100', b: 'x' }).ok, false);
});

test('percent split 50/30/20 of Nu. 1000', () => {
  const result = calculateSplit('percent', 1000, ['a', 'b', 'c'], { a: '50', b: '30', c: '20' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.shares, { a: 500, b: 300, c: 200 });
  assert.deepEqual(result.percentages, { a: 50, b: 30, c: 20 });
});

test('percent split 33.33 x 3 is accepted and still reconciles', () => {
  const result = calculateSplit('percent', 100, ['a', 'b', 'c'], { a: '33.33', b: '33.33', c: '33.33' });
  assert.equal(result.ok, true);
  assert.equal(sumShares(result.shares), 100);
});

test('percent split rejects totals that are not 100', () => {
  const result = calculateSplit('percent', 100, ['a', 'b'], { a: '50', b: '40' });
  assert.equal(result.ok, false);
  assert.match(result.error, /90%/);
});

test('rejects invalid totals and empty participant lists', () => {
  assert.equal(calculateSplit('equal', 0, ['a']).ok, false);
  assert.equal(calculateSplit('equal', '-5', ['a']).ok, false);
  assert.equal(calculateSplit('equal', 'abc', ['a']).ok, false);
  assert.equal(calculateSplit('equal', 100, []).ok, false);
});