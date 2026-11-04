// Small JSON cache on the phone (AsyncStorage). It lets the app show the last
// data it saw when there is no connection. Every function fails quietly, so a
// storage problem can never crash the app.
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'splitbtn_cache:';

export async function readCache(key) {
  try {
    const text = await AsyncStorage.getItem(PREFIX + key);
    return text ? JSON.parse(text) : null;
  } catch (error) {
    return null;
  }
}

export function writeCache(key, value) {
  AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {});
}

// Called on logout so the next person on this phone never sees old data.
export async function clearAllCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(PREFIX)));
  } catch (error) {
    console.warn('Could not clear cache:', error.message);
  }
}