// Horizontal bar chart drawn with plain Views (no chart library needed).
// Each bar is a percentage of the row width, so it fits any screen size.
import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIcon } from '../constants/categories';
import { formatNu } from '../utils/formatCurrency';
import { colors, spacing, radius, fontSize } from '../constants/theme';

// Colours cycle if there are more categories than colours.
const BAR_COLORS = [
  '#0F766E', '#F59E0B', '#2563EB', '#DB2777', '#7C3AED',
  '#16A34A', '#EA580C', '#0891B2', '#64748B',
];

function Bar({ percent, color }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Width cannot use the native driver, but this is a small, short animation.
    Animated.timing(width, { toValue: percent, duration: 600, useNativeDriver: false }).start();
  }, [percent]);

  const widthStyle = width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width: widthStyle, backgroundColor: color }]} />
    </View>
  );
}

export default function CategoryBarChart({ categories }) {
  return (
    <View>
      {categories.map((item, index) => (
        <View key={item.category} style={styles.row}
          accessible accessibilityLabel={`${item.category}, ${formatNu(item.amount)}, ${item.percent} percent`}>
          <View style={styles.labelRow}>
            <View style={styles.nameWrap}>
              <Ionicons name={getCategoryIcon(item.category)} size={18}
                color={BAR_COLORS[index % BAR_COLORS.length]} />
              <Text style={styles.name} numberOfLines={1}>{item.category}</Text>
            </View>
            <Text style={styles.amount}>{formatNu(item.amount)}</Text>
          </View>
          <Bar percent={item.percent} color={BAR_COLORS[index % BAR_COLORS.length]} />
          <Text style={styles.percent}>{item.percent}% of total</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.sm },
  name: { marginLeft: 6, fontSize: fontSize.body, fontWeight: '600', color: colors.text, flexShrink: 1 },
  amount: { fontSize: fontSize.body, fontWeight: '800', color: colors.text },
  track: {
    height: 12, borderRadius: radius.sm, backgroundColor: colors.border,
    marginTop: 6, overflow: 'hidden',
  },
  fill: { height: 12, borderRadius: radius.sm },
  percent: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});