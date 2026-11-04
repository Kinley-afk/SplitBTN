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
import AddEditExpenseScreen from '../screens/AddEditExpenseScreen';
import ExpenseDetailsScreen from '../screens/ExpenseDetailsScreen';
import ExpenseHistoryScreen from '../screens/ExpenseHistoryScreen';
import BalanceSummaryScreen from '../screens/BalanceSummaryScreen';
import SettleUpScreen from '../screens/SettleUpScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
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
            <Stack.Screen name="AddExpense" component={AddEditExpenseScreen}
              options={({ route }) => ({
                ...pushedScreenOptions,
                animation: 'slide_from_bottom',
                title: route.params?.expense ? 'Edit Expense' : 'Add Expense',
              })} />
            <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen}
              options={{ ...pushedScreenOptions, title: 'Expense' }} />
            <Stack.Screen name="ExpenseHistory" component={ExpenseHistoryScreen}
              options={{ ...pushedScreenOptions, title: 'Expense History' }} />
            <Stack.Screen name="BalanceSummary" component={BalanceSummaryScreen}
              options={{ ...pushedScreenOptions, title: 'Balances' }} />
            <Stack.Screen name="SettleUp" component={SettleUpScreen}
              options={{ ...pushedScreenOptions, title: 'Settle Up' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen}
              options={{ ...pushedScreenOptions, title: 'Notifications' }} />
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