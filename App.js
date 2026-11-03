import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { GroupsProvider } from './src/context/GroupsContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GroupsProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </GroupsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}