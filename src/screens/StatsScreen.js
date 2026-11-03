// Spending Statistics: pick a group, see spending by category.
// It reads live expenses, so the chart updates when expenses change.
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import FadeInView from '../components/FadeInView';
import CategoryBarChart from '../components/CategoryBarChart';
import { useGroups } from '../context/GroupsContext';
import useGroupExpenses from '../hooks/useGroupExpenses';
import { calculateCategoryTotals } from '../utils/spendingStats';
import { formatNu } from '../utils/formatCurrency';
import { colors, spacing, radius, fontSize } from '../constants/theme';

export default function StatsScreen() {
  const { groups, loading: groupsLoading } = useGroups();
  const [selectedId, setSelectedId] = useState(null);

  // Default to the first group; fall back if the selected group disappears.
  const activeGroup = groups.find((g) => g.id === selectedId) || groups[0];
  const groupId = activeGroup ? activeGroup.id : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Spending</Text>

        {groupsLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : groups.length === 0 ? (
          <EmptyState icon="pie-chart-outline" title="No groups yet"
            message="Join or create a group to see where your money goes." />
        ) : (
          <>
            <View style={styles.chipRow}>
              {groups.map((group) => (
                <Chip key={group.id} label={group.name}
                  selected={group.id === groupId} onPress={() => setSelectedId(group.id)} />
              ))}
            </View>
            {/* key resets the chart (and its listener) when the group changes */}
            <GroupSpending key={groupId} groupId={groupId} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GroupSpending({ groupId }) {
  const { expenses, loading, error } = useGroupExpenses(groupId);
  const stats = useMemo(() => calculateCategoryTotals(expenses), [expenses]);

  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />;
  }
  if (error) return <Text style={styles.error}>{error}</Text>;

  if (stats.categories.length === 0) {
    return (
      <Card style={{ marginTop: spacing.md }}>
        <EmptyState icon="pie-chart-outline" title="No spending yet"
          message="Add an expense in this group and the chart will appear here." />
      </Card>
    );
  }

  const top = stats.categories[0];
  return (
    <>
      <FadeInView>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total spent</Text>
          <Text style={styles.totalAmount}>{formatNu(stats.total)}</Text>
          <Text style={styles.totalSub}>
            Biggest category: {top.category} ({top.percent}%)
          </Text>
        </View>
      </FadeInView>
      <FadeInView delay={120}>
        <Text style={styles.sectionTitle}>By category</Text>
        <Card>
          <CategoryBarChart categories={stats.categories} />
        </Card>
      </FadeInView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg },
  heading: { fontSize: fontSize.title, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  totalCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  totalLabel: { color: colors.white, opacity: 0.85 },
  totalAmount: { color: colors.white, fontSize: 36, fontWeight: '800', marginVertical: spacing.sm },
  totalSub: { color: colors.white, opacity: 0.9 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  error: { color: colors.danger, marginTop: spacing.md },
});