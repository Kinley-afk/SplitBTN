// Full expense history for a group with search, filters and sorting.
// It reads live expenses, so results update when expenses change.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import ExpenseRow from '../components/ExpenseRow';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import useGroupExpenses from '../hooks/useGroupExpenses';
import { getUserProfiles } from '../services/groupService';
import { filterExpenses, sumExpenses, countActiveFilters } from '../utils/expenseFilter';
import { parseDateInput } from '../utils/dateUtils';
import { formatNu } from '../utils/formatCurrency';
import { CATEGORIES } from '../constants/categories';
import { colors, spacing, fontSize } from '../constants/theme';

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'highest', label: 'Highest amount' },
];

export default function ExpenseHistoryScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { groups } = useGroups();
  const group = groups.find((g) => g.id === groupId);
  const { expenses, loading, error } = useGroupExpenses(groupId);

  const [profiles, setProfiles] = useState({});
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [paidBy, setPaidBy] = useState('');
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Names for current members and for anyone who paid an expense.
  const idsKey = Array.from(new Set([
    ...(group ? group.memberIds : []),
    ...expenses.map((e) => e.paidBy),
  ])).join(',');
  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    getUserProfiles(idsKey.split(',')).then((result) => { if (!cancelled) setProfiles(result); });
    return () => { cancelled = true; };
  }, [idsKey]);

  const nameOf = (uid) => profiles[uid]?.displayName || '...';

  // Dates are typed as YYYY-MM-DD. An invalid date shows an error and is ignored.
  const fromDate = fromText.trim() ? parseDateInput(fromText) : null;
  const toDate = toText.trim() ? parseDateInput(toText) : null;
  const fromError = fromText.trim() && !fromDate ? 'Enter a valid date as YYYY-MM-DD.' : '';
  const toError = toText.trim() && !toDate ? 'Enter a valid date as YYYY-MM-DD.' : '';
  const rangeError = fromDate && toDate && fromDate > toDate ? 'The end date is before the start date.' : '';
  const useDates = !rangeError;

  const filters = {
    query,
    categories,
    paidBy,
    fromDate: useDates ? fromDate : null,
    toDate: useDates ? toDate : null,
  };
  const activeCount = countActiveFilters(filters);

  const results = useMemo(() => {
    const filtered = filterExpenses(expenses, filters, (uid) => profiles[uid]?.displayName || '');
    const sorted = [...filtered];
    if (sort === 'oldest') sorted.sort((a, b) => a.dateMs - b.dateMs || a.createdAtMs - b.createdAtMs);
    else if (sort === 'highest') sorted.sort((a, b) => b.amount - a.amount);
    // 'newest' keeps the order from the listener (newest first)
    return sorted;
  }, [expenses, profiles, query, categories, paidBy, fromText, toText, sort]);

  const toggleCategory = (key) =>
    setCategories((current) =>
      current.includes(key) ? current.filter((c) => c !== key) : [...current, key]
    );

  const clearFilters = () => {
    setQuery('');
    setCategories([]);
    setPaidBy('');
    setFromText('');
    setToText('');
  };

  if (!group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AppInput label="Search expenses" value={query} onChangeText={setQuery}
          placeholder="Title, category, person or amount" autoCorrect={false} />

        <View style={styles.chipRow}>
          <Chip label={activeCount > 0 ? `Filters (${activeCount})` : 'Filters'} icon="options-outline"
            selected={showFilters} onPress={() => setShowFilters((open) => !open)} />
          {activeCount > 0 ? <Chip label="Clear all" icon="close" onPress={clearFilters} /> : null}
        </View>

        {showFilters ? (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((item) => (
                <Chip key={item.key} label={item.key} icon={item.icon}
                  selected={categories.includes(item.key)} onPress={() => toggleCategory(item.key)} />
              ))}
            </View>

            <Text style={[styles.label, styles.gap]}>Paid by</Text>
            <View style={styles.chipRow}>
              <Chip label="Anyone" selected={paidBy === ''} onPress={() => setPaidBy('')} />
              {group.memberIds.map((uid) => (
                <Chip key={uid} label={nameOf(uid) + (uid === user.uid ? ' (You)' : '')}
                  selected={paidBy === uid} onPress={() => setPaidBy(uid)} />
              ))}
            </View>

            <View style={{ height: spacing.md }} />
            <AppInput label="From date (YYYY-MM-DD)" value={fromText} onChangeText={setFromText}
              error={fromError} keyboardType="numbers-and-punctuation" maxLength={10} placeholder="Optional" />
            <AppInput label="To date (YYYY-MM-DD)" value={toText} onChangeText={setToText}
              error={toError || rangeError} keyboardType="numbers-and-punctuation" maxLength={10}
              placeholder="Optional" />
          </Card>
        ) : null}

        <Text style={[styles.label, styles.gap]}>Sort by</Text>
        <View style={styles.chipRow}>
          {SORTS.map((item) => (
            <Chip key={item.key} label={item.label} selected={sort === item.key}
              onPress={() => setSort(item.key)} />
          ))}
        </View>

        <Text style={styles.summary}>
          {results.length} of {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
          {results.length > 0 ? ` · Total ${formatNu(sumExpenses(results))}` : ''}
        </Text>

        <Card>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : expenses.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No expenses yet"
              message="Add an expense in this group and it will appear here." />
          ) : results.length === 0 ? (
            <EmptyState icon="search-outline" title="No matching expenses"
              message="Try a different word, or clear some filters."
              actionLabel={activeCount > 0 ? 'Clear filters' : undefined} onAction={clearFilters} />
          ) : (
            results.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} payerName={nameOf(expense.paidBy)}
                onPress={() => navigation.navigate('ExpenseDetails', { groupId, expenseId: expense.id })} />
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  label: { fontSize: fontSize.small, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  gap: { marginTop: spacing.md },
  summary: { color: colors.textMuted, fontWeight: '600', marginVertical: spacing.md },
  error: { color: colors.danger, textAlign: 'center', paddingVertical: spacing.md },
});