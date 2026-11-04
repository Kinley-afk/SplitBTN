// Wraps a Firestore write so it never hangs the screen when offline.
// Firestore only finishes a write once the SERVER confirms it. Offline, that
// never happens, so we return 'queued' instead and the write syncs later.
// Returns 'synced' or 'queued'. A real rejection (e.g. permission denied) is
// still thrown when we are waiting for the server.
import { isOnlineNow } from './networkState';

const SYNC_WAIT_MS = 8000;

export async function writeWithOfflineSupport(writePromise) {
  // Marks the error as handled so a late failure never crashes the app.
  writePromise.catch((error) => console.warn('Write failed:', error.message));

  if (!isOnlineNow()) return 'queued';

  return Promise.race([
    writePromise.then(() => 'synced'),
    new Promise((resolve) => setTimeout(() => resolve('queued'), SYNC_WAIT_MS)),
  ]);
}