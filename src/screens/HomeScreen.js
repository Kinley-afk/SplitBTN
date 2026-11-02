// TEMPORARY: proves that login works. The real dashboard replaces this.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/authService';
import { colors, spacing, fontSize } from '../constants/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Hello, {user?.displayName || 'friend'}!</Text>
        <Text style={styles.sub}>{user?.email}</Text>
        <AppButton title="Log Out" variant="outline" onPress={logoutUser} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  sub: { color: colors.textMuted, marginTop: spacing.xs },
});