// Receipt helpers: pure functions with no React or Firebase code,
// tested in tests/receipt.test.js.

// The app limit must stay BELOW the Firestore rule limit (500000 characters).
export const MAX_RECEIPT_BASE64_LENGTH = 400000;

// true if the base64 text is present and small enough to store.
export function isReceiptWithinLimit(base64) {
  return typeof base64 === 'string' && base64.length > 0 && base64.length <= MAX_RECEIPT_BASE64_LENGTH;
}

// base64 text -> something <Image> can display.
export function receiptDataUri(base64) {
  return `data:image/jpeg;base64,${base64}`;
}

// Approximate size in KB. Base64 uses 4 characters for every 3 bytes.
export function receiptSizeKb(base64) {
  return Math.round((base64.length * 3) / 4 / 1024);
}