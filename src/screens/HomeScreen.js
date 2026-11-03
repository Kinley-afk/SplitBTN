// Home dashboard: live totals across all groups, group list, recent expenses.
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import GroupCard from '../components/GroupCard';
import ExpenseRow from '../components/ExpenseRow';
import EmptyState from '../components/EmptyState';
import FadeInView from '../components/FadeInView';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import useAllGroupsSummary from '../hooks/useAllGroupsSummary';
import { getUserProfiles } from '../services/groupService';
import { formatNu } from '../utils/formatCurrency';
import { colors, spacing, radius, fontSize } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { groups, loading: groupsLoading } = useGroups();
  const {
    youOwe, youAreOwed, netBalance, recentExpenses, loading: summaryLoading, error,
  } = useAllGroupsSummary(groups, user.uid);
  const [profiles, setProfiles] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const firstName = (user?.displayName || 'friend').split(' ')[0];

  // Load payer names for the recent expenses (only when the payers change).
  const payerKey = Array.from(new Set(recentExpenses.map((e) => e.paidBy))).join(',');
  useEffect(() => {
    if (!payerKey) return;
    let cancelled = false;
    getUserProfiles(payerKey.split(',')).then((result) => {
      if (!cancelled) setProfiles(result);
    });
    return () => { cancelled = true; };
  }, [payerKey]);

  const nameOf = (uid) => profiles[uid]?.displayName || '...';

  // + Add Expense: no groups -> Groups tab, one group -> straight to the form,
  // several groups -> choose one in the slide-up sheet.
  const handleAddExpense = () => {
    if (groups.length === 0) navigation.navigate('Groups');
    else if (groups.length === 1) navigation.navigate('AddExpense', { groupId: groups[0].id });
    else setPickerOpen(true);
  };

  const chooseGroup = (groupId) => {
    setPickerOpen(false);
    navigation.navigate('AddExpense', { groupId });
  };

  const netLabel = netBalance > 0 ? 'Overall, you are owed'
    : netBalance < 0 ? 'Overall, you owe' : 'Your net balance';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <FadeInView>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brand}>SplitBTN</Text>
              <Text style={styles.welcome}>Welcome, {firstName}</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatar}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{netLabel}</Text>
            <Text style={styles.balanceAmount}>{formatNu(Math.abs(netBalance))}</Text>
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.smallLabel}>You owe</Text>
                <Text style={styles.smallAmount}>{formatNu(youOwe)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.smallLabel}>You are owed</Text>
                <Text style={styles.smallAmount}>{formatNu(youAreOwed)}</Text>
              </View>
            </View>
            {summaryLoading && groups.length > 0 ? (
              <Text style={styles.updating}>Updating...</Text>
            ) : null}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </FadeInView>

        <FadeInView delay={200}>
          <AppButton title="+ Add Expense" onPress={handleAddExpense} />
        </FadeInView>

        <FadeInView delay={300} style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Your groups</Text>
          {groupsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : groups.length === 0 ? (
            <Card>
              <EmptyState
                icon="people-outline"
                title="No groups yet"
                message="Create or join a group to start splitting."
                actionLabel="Go to Groups"
                onAction={() => navigation.navigate('Groups')}
              />
            </Card>
          ) : (
            groups.slice(0, 3).map((group) => (
              <GroupCard key={group.id} group={group}
                onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })} />
            ))
          )}
        </FadeInView>

        <FadeInView delay={400}>
          <Text style={styles.sectionTitle}>Recent expenses</Text>
          <Card>
            {summaryLoading && groups.length > 0 ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : recentExpenses.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyText}>No expenses recorded yet.</Text>
              </View>
            ) : (
              recentExpenses.map((expense) => (
                <ExpenseRow key={`${expense.groupId}-${expense.id}`} expense={expense}
                  groupName={expense.groupName} payerName={nameOf(expense.paidBy)}
                  onPress={() => navigation.navigate('ExpenseDetails',
                    { groupId: expense.groupId, expenseId: expense.id })} />
              ))
            )}
          </Card>
        </FadeInView>
      </ScrollView>

      {/* Slide-up sheet for choosing which group the expense belongs to */}
      <Modal visible={pickerOpen} transparent animationType="slide"
        onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}
          accessibilityLabel="Close group chooser" />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Add expense to which group?</Text>
          {groups.map((group) => (
            <Pressable key={group.id} onPress={() => chooseGroup(group.id)}
              accessibilityRole="button" accessibilityLabel={`Add expense to ${group.name}`}
              style={({ pressed }) => [styles.sheetRow, pressed && { opacity: 0.6 }]}>
              <Ionicons name="people" size={22} color={colors.primary} />
              <Text style={styles.sheetRowText} numberOfLines={1}>{group.name}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          ))}
          <AppButton title="Cancel" variant="outline" onPress={() => setPickerOpen(false)}
            style={{ marginTop: spacing.md }} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  brand: { fontSize: fontSize.hero, fontWeight: '800', color: colors.primary },
  welcome: { color: colors.textMuted, fontSize: fontSize.body },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.title, fontWeight: '800', color: colors.white },
  balanceCard: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  balanceLabel: { color: colors.white, opacity: 0.85 },
  balanceAmount: { color: colors.white, fontSize: 36, fontWeight: '800', marginVertical: spacing.sm },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  smallLabel: { color: colors.white, opacity: 0.8, fontSize: fontSize.small },
  smallAmount: { color: colors.white, fontWeight: '700', fontSize: fontSize.body },
  updating: { color: colors.white, opacity: 0.7, fontSize: 12, marginTop: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.md },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.background, padding: spacing.lg,
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 56,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetRowText: { flex: 1, marginHorizontal: spacing.md, fontSize: fontSize.body, fontWeight: '600', color: colors.text },
});