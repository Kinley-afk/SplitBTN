// Unit tests for the PDF report builder. Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportHtml, escapeHtml } from '../src/utils/pdfReport.js';

const noon = (month, day) => new Date(2026, month - 1, day, 12, 0, 0).getTime();
const names = { a: 'Ram', b: 'Sonam' };
const nameOf = (uid) => names[uid] || 'Member';

const expenses = [
  { title: 'Dinner', amount: 100, category: 'Food', paidBy: 'a', dateMs: noon(10, 20) },
  { title: 'Rent', amount: 3000, category: 'Rent', paidBy: 'b', dateMs: noon(10, 21) },
];

function build(overrides = {}) {
  return buildReportHtml({
    groupName: 'Hostel Block A',
    generatedAtMs: noon(11, 4),
    expenses,
    balances: { a: 50, b: -50 },
    transfers: [{ from: 'b', to: 'a', amount: 50 }],
    nameOf,
    ...overrides,
  });
}

test('escapeHtml escapes the five special characters', () => {
  assert.equal(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`),
    '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;');
});

test('report contains the group name, expenses, dates and the formatted total', () => {
  const html = build();
  assert.ok(html.includes('Hostel Block A'));
  assert.ok(html.includes('Dinner'));
  assert.ok(html.includes('20 Oct 2026'));
  assert.ok(html.includes('Nu. 3,100.00'));
});

test('user text is escaped so it cannot inject HTML', () => {
  const html = build({
    groupName: '<b>Bad</b>',
    expenses: [{ title: '<script>alert(1)</script>', amount: 10, category: 'Other', paidBy: 'a', dateMs: noon(10, 20) }],
  });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&lt;b&gt;Bad&lt;/b&gt;'));
});

test('report includes a spending-by-category table', () => {
  const html = build();
  assert.ok(html.includes('Spending by category'));
  assert.ok(html.includes('Food'));
  assert.ok(html.includes('Rent'));
});

test('balances and suggested payments are listed with names', () => {
  const html = build();
  assert.ok(html.includes('gets back'));
  assert.ok(html.includes('owes'));
  assert.ok(html.includes('Sonam pays Ram'));
});

test('no transfers shows that everyone is settled up', () => {
  const html = build({ balances: { a: 0, b: 0 }, transfers: [] });
  assert.ok(html.includes('Everyone is settled up.'));
  assert.ok(html.includes('settled up'));
});

test('the filter note appears only when one is given', () => {
  assert.ok(build({ filterNote: 'Filtered: showing 1 of 2 expenses' }).includes('Filtered: showing 1 of 2 expenses'));
  assert.ok(!build().includes('Filtered:'));
});