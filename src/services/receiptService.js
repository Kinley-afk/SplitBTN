// Picking, shrinking and loading receipt photos.
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { isReceiptWithinLimit } from '../utils/receipt';

// Tried in order until the result is small enough to store.
const SHRINK_ATTEMPTS = [
  { width: 900, compress: 0.5 },
  { width: 700, compress: 0.4 },
  { width: 500, compress: 0.3 },
];

// Resizes and compresses a photo, and returns it as base64 JPEG text.
async function shrinkImage(uri) {
  for (const attempt of SHRINK_ATTEMPTS) {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ width: attempt.width, height: null }); // height follows the ratio
    const image = await context.renderAsync();
    const saved = await image.saveAsync({
      format: SaveFormat.JPEG, compress: attempt.compress, base64: true,
    });
    if (isReceiptWithinLimit(saved.base64)) return saved.base64;
  }
  throw new Error('RECEIPT_TOO_LARGE');
}

// source: 'camera' or 'gallery'.
// Returns base64 text, or null if the user cancelled.
// Throws 'CAMERA_DENIED' or 'RECEIPT_TOO_LARGE' for known problems.
export async function pickReceipt(source) {
  let result;
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('CAMERA_DENIED');
    result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
  } else {
    // Ask for gallery access so phones that need the prompt show it. Many Android
    // phones use a system photo picker that needs no permission, so a "no" here
    // does not stop us from trying to open the gallery.
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) console.warn('Gallery permission not granted, trying the picker anyway.');
    } catch (error) {
      console.warn('Gallery permission request failed:', error.message);
    }
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  }
  if (result.canceled || !result.assets || result.assets.length === 0) return null;
  return shrinkImage(result.assets[0].uri);
}

// Live listener on one expense's receipt. onData gets the base64 text, or null if none.
// Returns an unsubscribe function.
export function subscribeToReceipt(groupId, expenseId, onData, onError) {
  return onSnapshot(
    doc(db, 'groups', groupId, 'receipts', expenseId),
    (snapshot) => onData(snapshot.exists() ? snapshot.data().image : null),
    onError
  );
}