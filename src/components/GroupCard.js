// Tappable card for one group, with press-scale feedback.
import React, { useRef } from 'react';
import { Animated, Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../constants/theme';

export default function GroupCard({ group, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = (value) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 50 }).start();

  const count = group.memberIds.length;

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: spacing.md }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        accessibilityRole="button"
        accessibilityLabel={`Open group ${group.name}`}
        style={styles.card}
      >
        <View style={styles.icon}>
          <Ionicons name="people" size={24} color={colors.white} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.meta}>{count} {count === 1 ? 'member' : 'members'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', minHeight: 72,
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  icon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, marginHorizontal: spacing.md },
  name: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  meta: { color: colors.textMuted, fontSize: fontSize.small, marginTop: 2 },
});