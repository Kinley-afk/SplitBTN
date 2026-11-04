// Builds the HTML for the PDF expense report. A pure function with no React or
// Firebase code, tested in tests/pdfReport.test.js. expo-print turns the HTML into a PDF.
import { formatNu } from './formatCurrency.js';
import { formatDisplayDate } from './dateUtils.js';
import { calculateCategoryTotals } from './spendingStats.js';

// Expense titles and names are typed by users. Escaping them stops text like
// "<script>" from being treated as HTML.
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STYLES = `
  @page { margin: 24px; }
  body { font-family: Arial, Helvetica, sans-serif; color: #10201E; font-size: 12px; }
  h1 { color: #0F766E; font-size: 24px; margin: 0; }
  h2 { color: #0F766E; font-size: 15px; margin: 22px 0 8px; border-bottom: 2px solid #D9E2E0; padding-bottom: 4px; }
  .sub { color: #5F6F6C; margin: 4px 0 0; }
  .note { background: #FEF3C7; padding: 6px 10px; border-radius: 6px; margin-top: 10px; }
  .summary { display: flex; gap: 24px; margin-top: 14px; }
  .box { background: #F3F6F5; border-radius: 8px; padding: 10px 16px; }
  .box .label { color: #5F6F6C; font-size: 11px; }
  .box .value { font-size: 18px; font-weight: bold; color: #0F766E; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; background: #0F766E; color: #FFFFFF; padding: 6px 8px; font-size: 11px; }
  td { padding: 6px 8px; border-bottom: 1px solid #D9E2E0; }
  tr { page-break-inside: avoid; }
  .amount { text-align: right; white-space: nowrap; }
  th.amount { text-align: right; }
  .total td { font-weight: bold; border-top: 2px solid #0F766E; }
  .footer { margin-top: 24px; color: #5F6F6C; font-size: 10px; }
`;

// expenses:   the expenses to list (already filtered and sorted by the screen)
// balances:   { uid: Nu. }  for the WHOLE group (positive = is owed)
// transfers:  [{ from, to, amount }]  suggested payments for the whole group
// nameOf:     uid -> display name
// filterNote: text shown when a filter is active (empty string otherwise)
export function buildReportHtml({
  groupName, generatedAtMs, expenses, balances, transfers, nameOf, filterNote = '',
}) {
  const stats = calculateCategoryTotals(expenses);

  const categoryRows = stats.categories
    .map((item) =>
      `<tr><td>${escapeHtml(item.category)}</td>` +
      `<td class="amount">${item.percent}%</td>` +
      `<td class="amount">${formatNu(item.amount)}</td></tr>`)
    .join('');

  const expenseRows = expenses
    .map((expense) =>
      `<tr><td>${escapeHtml(formatDisplayDate(expense.dateMs))}</td>` +
      `<td>${escapeHtml(expense.title)}</td>` +
      `<td>${escapeHtml(expense.category)}</td>` +
      `<td>${escapeHtml(nameOf(expense.paidBy))}</td>` +
      `<td class="amount">${formatNu(expense.amount)}</td></tr>`)
    .join('');

  const balanceRows = Object.keys(balances)
    .sort((a, b) => balances[b] - balances[a])
    .map((uid) => {
      const value = balances[uid];
      const status = value > 0 ? 'gets back' : value < 0 ? 'owes' : 'settled up';
      const color = value > 0 ? '#16A34A' : value < 0 ? '#DC2626' : '#5F6F6C';
      return `<tr><td>${escapeHtml(nameOf(uid))}</td><td>${status}</td>` +
        `<td class="amount" style="color:${color}">${formatNu(Math.abs(value))}</td></tr>`;
    })
    .join('');

  const transferRows = transfers
    .map((transfer) =>
      `<tr><td>${escapeHtml(nameOf(transfer.from))} pays ${escapeHtml(nameOf(transfer.to))}</td>` +
      `<td class="amount">${formatNu(transfer.amount)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${STYLES}</style></head>
<body>
  <h1>SplitBTN</h1>
  <p class="sub">Expense report: ${escapeHtml(groupName)}</p>
  <p class="sub">Generated on ${escapeHtml(formatDisplayDate(generatedAtMs))}</p>
  ${filterNote ? `<div class="note">${escapeHtml(filterNote)}</div>` : ''}

  <div class="summary">
    <div class="box"><div class="label">Total spent</div><div class="value">${formatNu(stats.total)}</div></div>
    <div class="box"><div class="label">Expenses listed</div><div class="value">${expenses.length}</div></div>
  </div>

  <h2>Spending by category</h2>
  <table>
    <tr><th>Category</th><th class="amount">Share</th><th class="amount">Amount</th></tr>
    ${categoryRows}
  </table>

  <h2>Expenses</h2>
  <table>
    <tr><th>Date</th><th>Title</th><th>Category</th><th>Paid by</th><th class="amount">Amount</th></tr>
    ${expenseRows}
    <tr class="total"><td colspan="4">Total</td><td class="amount">${formatNu(stats.total)}</td></tr>
  </table>

  <h2>Balances (whole group, including payments)</h2>
  <table>
    <tr><th>Member</th><th>Status</th><th class="amount">Amount</th></tr>
    ${balanceRows}
  </table>

  <h2>Suggested payments</h2>
  ${transfers.length === 0
    ? '<p>Everyone is settled up.</p>'
    : `<table>${transferRows}</table>`}

  <p class="footer">Created with SplitBTN. Amounts are in Bhutanese Ngultrum (Nu.).</p>
</body>
</html>`;
}