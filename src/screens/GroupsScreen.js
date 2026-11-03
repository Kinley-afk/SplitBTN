// TEMPORARY: the real "My Groups" screen is built in the next stage.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../constants/theme';

export default function GroupsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Ionicons name="people-outline" size={64} color={colors.textMuted} />
        <Text style={styles.title}>No groups yet</Text>
        <Text style={styles.sub}>Creating and joining groups arrives in the next stage.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  sub: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
});