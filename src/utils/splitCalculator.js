// Split calculator: pure functions with no React or Firebase code,
// so they can be tested on their own (see tests/splitCalculator.test.js).
//
// KEY IDEA: money is converted to whole chetrum (1 Nu. = 100 chetrum)
// before any division. Whole numbers cannot drift the way decimals do
// (0.1 + 0.2 = 0.30000000000000004), so shares always add up exactly.

// Percentages may be this far from 100 because of rounding (33.33 x 3 = 99.99).
// Measured in hundredths of a percent, so 1 means 0.01%.
const PERCENT_TOLERANCE_HUNDREDTHS = 1;

export const toChetrum = (amount) => Math.round(Number(amount) * 100);
export const fromChetrum = (chetrum) => chetrum / 100;

// Accepts "1,250.50", "100" or the number 100. Returns NaN if the text is not
// a non-negative amount with at most 2 decimal places.
export function parseMoney(input) {
  const text = String(input ?? '').trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return NaN;
  return Number(text);
}

const fail = (error) => ({ ok: false, error });

// { uid: chetrum } -> { uid: Nu. }
function toNuMap(chetrumByUid) {
  const result = {};
  Object.keys(chetrumByUid).forEach((id) => {
    result[id] = fromChetrum(chetrumByUid[id]);
  });
  return result;
}

// Everyone gets the same whole amount; the leftover chetrum go one each
// to the first people in the list.
function splitEqually(totalChetrum, ids) {
  const base = Math.floor(totalChetrum / ids.length);
  const leftover = totalChetrum - base * ids.length;
  const result = {};
  ids.forEach((id, index) => {
    result[id] = base + (index < leftover ? 1 : 0);
  });
  return result;
}

// Largest-remainder method: round every share down, then give the leftover
// chetrum to the shares that lost the most when rounded down.
function splitByWeights(totalChetrum, ids, weights, weightSum) {
  const parts = ids.map((id) => {
    const exact = (totalChetrum * weights[id]) / weightSum;
    const whole = Math.floor(exact);
    return { id, whole, fraction: exact - whole };
  });

  let leftover = totalChetrum - parts.reduce((sum, part) => sum + part.whole, 0);
  [...parts]
    .sort((a, b) => b.fraction - a.fraction)
    .forEach((part) => {
      if (leftover > 0) {
        part.whole += 1;
        leftover -= 1;
      }
    });

  const result = {};
  parts.forEach((part) => { result[part.id] = part.whole; });
  return result;
}

// Main entry point used by the Add Expense screen.
//   method:         'equal' | 'exact' | 'percent'
//   totalAmount:    the expense amount in Nu. (number or text)
//   participantIds: uids of the people sharing the cost
//   inputs:         { uid: amount or percentage } for 'exact' / 'percent'
// Returns { ok: true, shares, percentages } or { ok: false, error }.
// `shares` is { uid: Nu. } and always adds up to the total exactly.
export function calculateSplit(method, totalAmount, participantIds, inputs = {}) {
  const total = parseMoney(totalAmount);
  if (Number.isNaN(total) || total <= 0) {
    return fail('Enter a valid amount greater than 0.');
  }
  if (!participantIds || participantIds.length === 0) {
    return fail('Select at least one person to share this expense.');
  }
  const totalChetrum = toChetrum(total);

  if (method === 'equal') {
    return { ok: true, shares: toNuMap(splitEqually(totalChetrum, participantIds)), percentages: {} };
  }

  if (method === 'exact') {
    const chetrumByUid = {};
    let assigned = 0;
    for (const id of participantIds) {
      const value = parseMoney(inputs[id]);
      if (Number.isNaN(value)) {
        return fail('Enter an amount for every selected person (use 0 if they pay nothing).');
      }
      chetrumByUid[id] = toChetrum(value);
      assigned += chetrumByUid[id];
    }
    if (assigned !== totalChetrum) {
      return fail(
        `Amounts add up to Nu. ${fromChetrum(assigned).toFixed(2)}, ` +
        `but the expense is Nu. ${fromChetrum(totalChetrum).toFixed(2)}.`
      );
    }
    return { ok: true, shares: toNuMap(chetrumByUid), percentages: {} };
  }

  if (method === 'percent') {
    const percentages = {};
    const weights = {}; // percentage in hundredths, so 33.33% -> 3333
    let weightSum = 0;
    for (const id of participantIds) {
      const percent = parseMoney(inputs[id]);
      if (Number.isNaN(percent)) return fail('Enter a percentage for every selected person.');
      if (percent > 100) return fail('A percentage cannot be more than 100.');
      percentages[id] = percent;
      weights[id] = Math.round(percent * 100);
      weightSum += weights[id];
    }
    if (Math.abs(weightSum - 10000) > PERCENT_TOLERANCE_HUNDREDTHS) {
      return fail(`Percentages add up to ${weightSum / 100}%, but they must total 100%.`);
    }
    const chetrumByUid = splitByWeights(totalChetrum, participantIds, weights, weightSum);
    return { ok: true, shares: toNuMap(chetrumByUid), percentages };
  }

  return fail('Unknown split method.');
}

// Adds up shares exactly (in chetrum) and returns Nu.
export function sumShares(shares) {
  const chetrum = Object.values(shares).reduce((sum, value) => sum + toChetrum(value), 0);
  return fromChetrum(chetrum);
}