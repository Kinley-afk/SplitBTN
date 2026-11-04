// A Firestore listener that shows SAVED data first, then live data.
// This is what makes the app usable after a restart with no connection.
import { onSnapshot } from 'firebase/firestore';
import { readCache, writeCache } from './cacheStorage';

// source:      a collection or query
// cacheKey:    where to save the data on the phone
// mapSnapshot: turns a Firestore snapshot into a plain array
// Returns an unsubscribe function.
export function listenWithCache(source, cacheKey, mapSnapshot, onData, onError) {
  let cancelled = false;
  let unsubscribe = () => {};
  let seeded = false;   // true when saved data was shown first
  let gotReal = false;  // true once a trustworthy snapshot has arrived

  // The saved data is read BEFORE listening, so an empty offline snapshot
  // can never arrive first and hide it.
  readCache(cacheKey).then((cached) => {
    if (cancelled) return;
    if (cached) {
      seeded = true;
      onData(cached);
    }
    unsubscribe = onSnapshot(
      source,
      (snapshot) => {
        // Offline restart: Firestore's memory cache is empty, so its first answer
        // is "nothing". Keep showing the saved data instead of wiping it.
        if (!gotReal && seeded && snapshot.metadata.fromCache && snapshot.empty) return;
        gotReal = true;
        const items = mapSnapshot(snapshot);
        onData(items);
        // Only save confirmed server data, never half-synced local changes.
        if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
          writeCache(cacheKey, items);
        }
      },
      onError
    );
  });

  return () => {
    cancelled = true;
    unsubscribe(); // listener cleanup
  };
}