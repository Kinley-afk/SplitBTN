// Unit tests for the receipt helpers. Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_RECEIPT_BASE64_LENGTH, isReceiptWithinLimit, receiptDataUri, receiptSizeKb,
} from '../src/utils/receipt.js';

test('the app limit is below the Firestore rule limit of 500000', () => {
  assert.ok(MAX_RECEIPT_BASE64_LENGTH < 500000);
});

test('isReceiptWithinLimit accepts only non-empty text within the limit', () => {
  assert.equal(isReceiptWithinLimit('abc'), true);
  assert.equal(isReceiptWithinLimit('a'.repeat(MAX_RECEIPT_BASE64_LENGTH)), true);
  assert.equal(isReceiptWithinLimit('a'.repeat(MAX_RECEIPT_BASE64_LENGTH + 1)), false);
  assert.equal(isReceiptWithinLimit(''), false);
  assert.equal(isReceiptWithinLimit(null), false);
  assert.equal(isReceiptWithinLimit(12345), false);
});

test('receiptDataUri adds the JPEG data prefix', () => {
  assert.equal(receiptDataUri('AAAA'), 'data:image/jpeg;base64,AAAA');
});

test('receiptSizeKb converts base64 length to approximate kilobytes', () => {
  assert.equal(receiptSizeKb('a'.repeat(4000)), 3);      // 3000 bytes is about 3 KB
  assert.equal(receiptSizeKb('a'.repeat(400000)), 293);  // 300000 bytes is about 293 KB
});