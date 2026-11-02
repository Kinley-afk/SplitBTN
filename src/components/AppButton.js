// Reusable button with press animation and loading state.
import React, { useRef } from 'react';
import { Animated, Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, fontSize } from '../constants/theme';

export default function AppButton({ title, onPress, loading = false, variant = 'primary', style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 50 }).start();

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={[styles.button, isPrimary ? styles.primary : styles.outline]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
        ) : (
          <Text style={[styles.text, { color: isPrimary ? colors.white : colors.primary }]}>
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary },
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' },
  text: { fontSize: fontSize.body, fontWeight: '700' },
});