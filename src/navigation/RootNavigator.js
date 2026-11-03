// Decides which screens exist based on login state.
// Logged-out users only have Login/Register in the navigator,
// so protected screens cannot be reached (Feature 1: route protection).
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import MainTabs from './MainTabs';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator();

// Screens pushed on top of the tabs show a native header with a back button.
const pushedScreenOptions = {
  headerShown: true,
  headerTintColor: colors.primary,
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  animation: 'slide_from_right',
};

export default function RootNavigator() {
  const { user, initializing } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  // Show splash until its animation ends AND the saved session is restored.
  if (!splashDone || initializing) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen}
              options={{ ...pushedScreenOptions, title: 'Create Group' }} />
            <Stack.Screen name="JoinGroup" component={JoinGroupScreen}
              options={{ ...pushedScreenOptions, title: 'Join Group' }} />
            <Stack.Screen name="GroupDetails" component={GroupDetailsScreen}
              options={{ ...pushedScreenOptions, title: 'Group' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}