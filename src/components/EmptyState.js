// Reusable "nothing here yet" block with an icon, message and optional button.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import { colors, spacing, fontSize } from '../constants/theme';

export default function EmptyState({ icon, title, message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={52} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel ? (
        <AppButton title={actionLabel} onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  message: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  button: { marginTop: spacing.md, alignSelf: 'stretch' },
});