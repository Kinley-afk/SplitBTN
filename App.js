import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { GroupsProvider } from './src/context/GroupsContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import RootNavigator from './src/navigation/RootNavigator';
import OfflineBanner from './src/components/OfflineBanner';
import { restoreSimulatedOffline } from './src/services/networkState';

export default function App() {
  // Keeps "simulate offline" switched on after a reload, if it was on before.
  useEffect(() => {
    restoreSimulatedOffline();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GroupsProvider>
          <NotificationsProvider>
            <StatusBar style="auto" />
            <RootNavigator />
            <OfflineBanner />
          </NotificationsProvider>
        </GroupsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}