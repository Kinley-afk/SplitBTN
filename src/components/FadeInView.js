// Wrapper that fades and slides its children upward when first shown.
// `delay` lets several cards enter one after another (staggered entrance).
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function FadeInView({ children, delay = 0, style }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <Animated.View style={[{ opacity: progress, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}