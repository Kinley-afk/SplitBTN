// One line in the expense history list.
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIcon } from '../constants/categories';
import { formatNu } from '../utils/formatCurrency';
import { formatDisplayDate } from '../utils/dateUtils';
import { colors, spacing, fontSize } from '../constants/theme';

export default function ExpenseRow({ expense, payerName, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${expense.title}, ${formatNu(expense.amount)}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name={getCategoryIcon(expense.category)} size={20} color={colors.white} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {payerName} paid · {formatDisplayDate(expense.dateMs)} · {expense.category}
        </Text>
      </View>
      <Text style={styles.amount}>{formatNu(expense.amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.6 },
  icon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, marginHorizontal: spacing.md },
  title: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  amount: { fontSize: fontSize.body, fontWeight: '800', color: colors.text },
});