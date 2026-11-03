// Balance calculator: pure functions with no React or Firebase code,
// tested in tests/balanceCalculator.test.js.
//
// Sign convention for a person's balance:
//   positive -> the group owes them money (they should RECEIVE)
//   negative -> they owe the group money (they should PAY)
// All maths is done in whole chetrum (1 Nu. = 100 chetrum), so it is exact.
import { toChetrum, fromChetrum } from './splitCalculator.js';

// Step 1: net balance of every person, in chetrum.
//   expense:    { paidBy, amount, shares: { uid: Nu. } }
//   settlement: { from, to, amount }   (from paid money to `to`)
function calculateNetChetrum(expenses, settlements) {
  const net = {};
  const add = (uid, chetrum) => { net[uid] = (net[uid] || 0) + chetrum; };

  expenses.forEach((expense) => {
    add(expense.paidBy, toChetrum(expense.amount)); // payer fronted the money
    Object.keys(expense.shares).forEach((uid) => {
      add(uid, -toChetrum(expense.shares[uid]));    // each person's share is a debt
    });
  });

  settlements.forEach((settlement) => {
    const chetrum = toChetrum(settlement.amount);
    add(settlement.from, chetrum);  // sender owes less
    add(settlement.to, -chetrum);   // receiver is owed less
  });

  return net;
}

// Step 2: greedy debt simplification. Repeatedly match the biggest debtor
// with the biggest creditor. At least one of them reaches zero each time,
// so the result has at most (people - 1) transfers.
// Ties are broken by uid so the output is always the same for the same data.
function simplifyDebts(net) {
  const debtors = [];
  const creditors = [];
  Object.keys(net).sort().forEach((uid) => {
    if (net[uid] < 0) debtors.push({ uid, amount: -net[uid] });
    else if (net[uid] > 0) creditors.push({ uid, amount: net[uid] });
  });

  const biggestFirst = (a, b) => b.amount - a.amount || a.uid.localeCompare(b.uid);
  const transfers = [];

  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(biggestFirst);
    creditors.sort(biggestFirst);
    const debtor = debtors[0];
    const creditor = creditors[0];
    const amount = Math.min(debtor.amount, creditor.amount);

    transfers.push({ from: debtor.uid, to: creditor.uid, amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtors.shift();
    if (creditor.amount === 0) creditors.shift();
  }
  return transfers;
}

// Main entry point.
// Returns:
//   balances:   { uid: Nu. }  (positive = is owed, negative = owes)
//   transfers:  [{ from, to, amount: Nu. }]  simplified "who pays whom"
//   totalDrift: Nu. left over when all balances are added (0 for healthy data)
//   isBalanced: true when totalDrift is 0
export function calculateBalances(expenses, settlements = []) {
  const net = calculateNetChetrum(expenses, settlements);

  const balances = {};
  let drift = 0;
  Object.keys(net).forEach((uid) => {
    balances[uid] = fromChetrum(net[uid]);
    drift += net[uid];
  });

  const transfers = simplifyDebts(net).map((transfer) => ({
    from: transfer.from,
    to: transfer.to,
    amount: fromChetrum(transfer.amount),
  }));

  return { balances, transfers, totalDrift: fromChetrum(drift), isBalanced: drift === 0 };
}