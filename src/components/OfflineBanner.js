// Small floating pill: "You're offline" while offline, "Back online" briefly after.
// It never blocks touches.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useOnline from '../hooks/useOnline';
import { colors, spacing, fontSize } from '../constants/theme';

export default function OfflineBanner() {
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('hidden'); // 'hidden' | 'offline' | 'back'
  const wasOffline = useRef(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setMode('offline');
      return undefined;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      setMode('back');
      const timer = setTimeout(() => setMode('hidden'), 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [online]);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: mode === 'hidden' ? 0 : 1, duration: 250, useNativeDriver: true,
    }).start();
  }, [mode]);

  const isOffline = mode === 'offline';
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.pill,
        { bottom: insets.bottom + 72, opacity, backgroundColor: isOffline ? colors.text : colors.success },
      ]}
    >
      <Ionicons name={isOffline ? 'cloud-offline-outline' : 'cloud-done-outline'} size={16} color={colors.white} />
      <Text style={styles.text}>
        {isOffline ? "You're offline. Showing saved data." : 'Back online. Syncing...'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20,
  },
  text: { color: colors.white, fontSize: fontSize.small, fontWeight: '600', marginLeft: 6 },
});