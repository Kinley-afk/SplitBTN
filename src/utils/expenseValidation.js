// Validation for the expense form. Each returns an error message, or '' if valid.
import { parseMoney } from './splitCalculator';
import { parseDateInput } from './dateUtils';

export function validateExpenseTitle(title) {
  const trimmed = title.trim();
  if (!trimmed) return 'Please enter a title.';
  if (trimmed.length > 60) return 'Title must be 60 characters or fewer.';
  return '';
}

export function validateAmount(text) {
  const value = parseMoney(text);
  if (Number.isNaN(value)) return 'Enter a valid amount (up to 2 decimal places).';
  if (value <= 0) return 'Amount must be greater than 0.';
  if (value > 10000000) return 'Amount is too large.';
  return '';
}

export function validateExpenseDate(text) {
  return parseDateInput(text) ? '' : 'Enter a valid date as YYYY-MM-DD.';
}