// Animated branded splash: logo fades and scales in, then the screen fades out.
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../constants/theme';

export default function SplashScreen({ onFinish }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Respect the phone's "reduce motion" accessibility setting.
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      if (cancelled) return;
      if (reduceMotion) {
        opacity.setValue(1);
        scale.setValue(1);
        setTimeout(onFinish, 600);
        return;
      }
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]),
        Animated.delay(600),
        Animated.timing(screenOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => onFinish());
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <Ionicons name="wallet" size={84} color={colors.white} />
        <Text style={styles.title}>SplitBTN</Text>
        <Text style={styles.tagline}>Share expenses. Settle fairly.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 40, fontWeight: '800', color: colors.white, marginTop: spacing.md },
  tagline: { fontSize: fontSize.body, color: colors.white, opacity: 0.85, marginTop: spacing.sm },
});