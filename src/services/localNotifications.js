// Local (on-device) notification banners using expo-notifications.
// Local notifications work in Expo Go. Remote push does not (Android, SDK 53+),
// so these banners are triggered by our own Firestore listener, not by a push server.
import { Platform } from 'react-native';

// Loaded defensively: if the module fails, the in-app list still works.
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('expo-notifications unavailable:', error.message);
}

let granted = false;

// Call once after login: sets up the Android channel and asks permission.
export async function setupLocalNotifications() {
  if (!Notifications || granted) return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn('Notification handler setup failed:', error.message);
  }

  // The channel is optional. Expo Go can fail here, and that must not stop
  // the permission request below.
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'SplitBTN',
        importance: Notifications.AndroidImportance.HIGH,
      });
    } catch (error) {
      console.warn('Notification channel not created (continuing):', error.message);
    }
  }

  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    granted = status === 'granted';
  } catch (error) {
    console.warn('Notification permission failed:', error.message);
  }
}

// Shows a banner right now. Silently does nothing if permission was denied.
export async function showLocalBanner({ title, body }) {
  if (!Notifications || !granted) return;
  try {
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch (error) {
    console.warn('Could not show notification:', error.message);
  }
}