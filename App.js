import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { GroupsProvider } from './src/context/GroupsContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GroupsProvider>
          <NotificationsProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </NotificationsProvider>
        </GroupsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}