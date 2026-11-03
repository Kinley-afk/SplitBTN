// Group details: invite code, balances and settle-up shortcuts, expense history,
// live member list, leave button (blocked while you still owe or are owed money).
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import ExpenseRow from '../components/ExpenseRow';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import useGroupBalances from '../hooks/useGroupBalances';
import { getUserProfiles, leaveGroup, getFriendlyGroupError } from '../services/groupService';
import { toChetrum, fromChetrum } from '../utils/splitCalculator';
import { formatNu } from '../utils/formatCurrency';
import { colors, spacing, radius, fontSize } from '../constants/theme';

export default function GroupDetailsScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { groups } = useGroups();
  // One hook gives expenses, settlements and the calculated balances.
  const {
    expenses, balances, loading: dataLoading, error: dataError,
  } = useGroupBalances(groupId);
  const [profiles, setProfiles] = useState({});
  const [leaving, setLeaving] = useState(false);

  // The group comes from the live context, so members appear in real time.
  const group = groups.find((g) => g.id === groupId);

  // Reload names only when the member list actually changes.
  const memberKey = group ? group.memberIds.join(',') : '';
  useEffect(() => {
    if (!group) return;
    let cancelled = false;
    getUserProfiles(group.memberIds).then((result) => {
      if (!cancelled) setProfiles(result);
    });
    return () => { cancelled = true; };
  }, [memberKey]);

  if (!group) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading group...</Text>
      </View>
    );
  }

  const nameOf = (uid) => profiles[uid]?.displayName || '...';

  // Sum in whole chetrum so the total never drifts.
  const totalSpent = fromChetrum(expenses.reduce((sum, e) => sum + toChetrum(e.amount), 0));

  const handleShare = () =>
    Share.share({
      message: `Join my SplitBTN group "${group.name}" using invite code: ${group.inviteCode}`,
    });

  const doLeave = async () => {
    setLeaving(true);
    try {
      await leaveGroup(group.id, user.uid);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not leave group', getFriendlyGroupError(error));
      setLeaving(false);
    }
  };

  const handleLeave = () => {
    const isLastMember = group.memberIds.length === 1;

    // The last member can always leave (the group is deleted).
    // Everyone else must be settled up first. This check is in the app only:
    // Firestore rules cannot calculate balances.
    if (!isLastMember) {
      if (dataLoading || dataError) {
        Alert.alert('Please wait', 'Your balance could not be checked yet. Try again in a moment.');
        return;
      }
      const myBalance = balances[user.uid] || 0;
      if (myBalance !== 0) {
        Alert.alert(
          'Settle up first',
          myBalance < 0
            ? `You still owe ${formatNu(-myBalance)} in this group. Record your payments before leaving.`
            : `You are still owed ${formatNu(myBalance)} in this group. Ask for payment (or record it) before leaving.`
        );
        return;
      }
    }

    Alert.alert(
      'Leave group?',
      isLastMember
        ? 'You are the last member, so the group will be deleted.'
        : `You will no longer see "${group.name}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: doLeave },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <FadeInView>
          <Text style={styles.name}>{group.name}</Text>
          <Card style={styles.codeCard}>
            <Text style={styles.label}>Invite code</Text>
            <Text style={styles.code} accessibilityLabel={`Invite code ${group.inviteCode.split('').join(' ')}`}>
              {group.inviteCode}
            </Text>
            <AppButton title="Share Code" variant="outline" onPress={handleShare} />
          </Card>
          <AppButton title="+ Add Expense"
            onPress={() => navigation.navigate('AddExpense', { groupId })} />
          <View style={styles.buttonRow}>
            <AppButton title="Balances" variant="outline" style={styles.rowButton}
              onPress={() => navigation.navigate('BalanceSummary', { groupId })} />
            <AppButton title="Settle Up" variant="outline" style={styles.rowButton}
              onPress={() => navigation.navigate('SettleUp', { groupId })} />
          </View>
        </FadeInView>

        <FadeInView delay={120} style={{ marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses ({expenses.length})</Text>
            {expenses.length > 0 ? <Text style={styles.total}>Total {formatNu(totalSpent)}</Text> : null}
          </View>
          <Card>
            {dataLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : dataError ? (
              <Text style={styles.errorText}>{dataError}</Text>
            ) : expenses.length === 0 ? (
              <EmptyState icon="receipt-outline" title="No expenses yet"
                message="Tap Add Expense to record the first one." />
            ) : (
              expenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} payerName={nameOf(expense.paidBy)}
                  onPress={() => navigation.navigate('ExpenseDetails', { groupId, expenseId: expense.id })} />
              ))
            )}
          </Card>
        </FadeInView>

        <FadeInView delay={240}>
          <Text style={styles.sectionTitle}>Members ({group.memberIds.length})</Text>
          <Card>
            {group.memberIds.map((uid) => {
              const displayName = nameOf(uid);
              return (
                <View key={uid} style={styles.memberRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName}>
                    {displayName}{uid === user.uid ? ' (You)' : ''}
                  </Text>
                  {uid === group.createdBy ? <Text style={styles.badge}>Creator</Text> : null}
                </View>
              );
            })}
          </Card>
        </FadeInView>

        <AppButton title="Leave Group" variant="outline" onPress={handleLeave}
          loading={leaving} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textMuted, marginTop: spacing.sm },
  name: { fontSize: fontSize.title, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  codeCard: { alignItems: 'stretch' },
  label: { color: colors.textMuted, fontSize: fontSize.small },
  code: {
    fontSize: 34, fontWeight: '800', letterSpacing: 6, color: colors.primary,
    textAlign: 'center', marginVertical: spacing.md,
  },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  rowButton: { flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  total: { color: colors.textMuted, fontSize: fontSize.small, fontWeight: '600' },
  errorText: { color: colors.danger, textAlign: 'center', paddingVertical: spacing.md },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: fontSize.body },
  memberName: { flex: 1, fontSize: fontSize.body, color: colors.text, fontWeight: '600' },
  badge: {
    color: colors.primary, fontSize: fontSize.small, fontWeight: '700',
    borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
});