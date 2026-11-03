// Selectable pill used for categories, members and split methods.
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, fontSize } from '../constants/theme';

export default function Chip({ label, selected, onPress, icon }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={label}
      style={[styles.chip, selected && styles.selected]}
    >
      {icon ? (
        <Ionicons name={icon} size={16} color={selected ? colors.white : colors.primary} style={styles.icon} />
      ) : null}
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', minHeight: 44,
    paddingHorizontal: 14, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  icon: { marginRight: 6 },
  text: { fontSize: fontSize.small, fontWeight: '600', color: colors.text },
  textSelected: { color: colors.white },
});