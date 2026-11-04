// Tracks whether the phone is online. A plain module (no React) so services can use it.
// It also supports a "simulate offline" mode for testing and demos: Firestore's
// network is switched off and the choice is remembered across reloads.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from './firebase';

// Loaded defensively: if it fails, the app simply assumes it is online.
let NetInfo = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (error) {
  console.warn('NetInfo unavailable:', error.message);
}

const SIMULATE_KEY = 'splitbtn_simulate_offline';
let deviceOnline = true;
let simulatedOffline = false;
let online = true;
const listeners = new Set();

function update() {
  const next = deviceOnline && !simulatedOffline;
  if (next === online) return;
  online = next;
  listeners.forEach((listener) => listener(online));
}

if (NetInfo) {
  NetInfo.addEventListener((state) => {
    // isConnected only: a slow or odd network is handled by the write timeout instead.
    deviceOnline = state.isConnected !== false;
    update();
  });
}

export const isOnlineNow = () => online;
export const isSimulatingOffline = () => simulatedOffline;

export function subscribeToNetwork(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function setSimulatedOffline(enabled) {
  simulatedOffline = enabled;
  update();
  try {
    await AsyncStorage.setItem(SIMULATE_KEY, enabled ? '1' : '0');
    if (enabled) await disableNetwork(db);
    else await enableNetwork(db);
  } catch (error) {
    console.warn('Could not change offline mode:', error.message);
  }
}

// Called once at startup so a reload keeps the simulated offline mode.
export async function restoreSimulatedOffline() {
  try {
    if ((await AsyncStorage.getItem(SIMULATE_KEY)) === '1') {
      simulatedOffline = true;
      update();
      await disableNetwork(db);
    }
  } catch (error) {
    console.warn('Could not restore offline mode:', error.message);
  }
}