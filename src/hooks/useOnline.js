// true when online, false when offline. Updates when the connection changes.
import { useEffect, useState } from 'react';
import { isOnlineNow, subscribeToNetwork } from '../services/networkState';

export default function useOnline() {
  const [online, setOnline] = useState(isOnlineNow());
  useEffect(() => {
    setOnline(isOnlineNow());
    return subscribeToNetwork(setOnline);
  }, []);
  return online;
}