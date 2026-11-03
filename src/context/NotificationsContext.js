// One shared live listener for the user's notifications.
// Starts on login, stops (cleanup) on logout. New arrivals also show a banner.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToNotifications } from '../services/notificationService';
import { setupLocalNotifications, showLocalBanner } from '../services/localNotifications';

const NotificationsContext = createContext({ notifications: [], unreadCount: 0, loading: true });

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setupLocalNotifications();

    // The first snapshot contains old notifications; only later ones get a banner.
    let firstSnapshot = true;
    const unsubscribe = subscribeToNotifications(
      uid,
      (list, newOnes) => {
        setNotifications(list);
        setLoading(false);
        if (!firstSnapshot) newOnes.forEach((n) => showLocalBanner(n));
        firstSnapshot = false;
      },
      (error) => {
        console.warn('Notifications listener error:', error.message);
        setLoading(false);
      }
    );
    return unsubscribe; // listener cleanup
  }, [uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);