// Live preview of each person's share. It flickers briefly whenever the
// numbers change, so the user sees the update happen.
import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { formatNu } from '../utils/formatCurrency';
import { colors, spacing, radius, fontSize } from '../constants/theme';

export default function SplitPreview({ result, nameOf, hasAmount }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const signature = result.ok ? JSON.stringify(result.shares) : result.error;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.4, duration: 80, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [signature]);

  return (
    <Animated.View style={[styles.box, { opacity: pulse }]}>
      <Text style={styles.title}>Split preview</Text>
      {!hasAmount ? (
        <Text style={styles.hint}>Enter an amount to see each person's share.</Text>
      ) : result.ok ? (
        Object.keys(result.shares).map((uid) => (
          <View key={uid} style={styles.row}>
            <Text style={styles.name}>{nameOf(uid)}</Text>
            <Text style={styles.amount}>{formatNu(result.shares[uid])}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.error}>{result.error}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  title: { fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  name: { color: colors.text, fontSize: fontSize.body },
  amount: { color: colors.primary, fontWeight: '800', fontSize: fontSize.body },
  hint: { color: colors.textMuted },
  error: { color: colors.danger },
});