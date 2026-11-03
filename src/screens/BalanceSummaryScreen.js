// Who owes whom in a group. Live: it updates when expenses or payments change.
// Someone who is owed money can send a payment reminder (Remind button).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import useGroupBalances from '../hooks/useGroupBalances';
import { getUserProfiles } from '../services/groupService';
import { notifyMembers } from '../services/notificationService';
import { formatNu } from '../utils/formatCurrency';
import { colors, spacing, radius, fontSize } from '../constants/theme';

export default function BalanceSummaryScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { groups } = useGroups();
  const group = groups.find((g) => g.id === groupId);
  const { balances, transfers, isBalanced, loading, error } = useGroupBalances(groupId);
  const [profiles, setProfiles] = useState({});
  // "debtorId-creditorId" keys for reminders already sent (stops repeat taps).
  const [reminded, setReminded] = useState({});

  // Names for current members AND anyone who left but appears in the records.
  const ids = useMemo(
    () => Array.from(new Set([...(group ? group.memberIds : []), ...Object.keys(balances)])),
    [group, balances]
  );
  const idsKey = ids.join(',');
  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    getUserProfiles(ids).then((result) => { if (!cancelled) setProfiles(result); });
    return () => { cancelled = true; };
  }, [idsKey]);

  if (!group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const nameOf = (uid) => (profiles[uid]?.displayName || '...') + (uid === user.uid ? ' (You)' : '');
  const myBalance = balances[user.uid] || 0;

  // Sends a payment reminder to someone who owes the current user.
  const handleRemind = async (transfer) => {
    const key = `${transfer.from}-${transfer.to}`;
    if (reminded[key]) return;
    setReminded((current) => ({ ...current, [key]: true }));
    const sent = await notifyMembers({
      groupId,
      recipientIds: [transfer.from],
      fromUid: user.uid,
      type: 'reminder',
      title: `Payment reminder from ${group.name}`,
      body: `${user.displayName || 'A member'} reminded you to pay ${formatNu(transfer.amount)}`,
    });
    if (!sent) {
      setReminded((current) => ({ ...current, [key]: false }));
      Alert.alert('Reminder not sent', 'Check your connection and try again.');
    }
  };

  // Show current members, plus anyone who left but still has a balance.
  const rows = ids
    .filter((uid) => group.memberIds.includes(uid) || (balances[uid] || 0) !== 0)
    .sort((a, b) => (balances[b] || 0) - (balances[a] || 0));

  const amountColor = (value) =>
    value > 0 ? colors.success : value < 0 ? colors.danger : colors.textMuted;
  const statusText = (value) =>
    value > 0 ? 'gets back' : value < 0 ? 'owes' : 'settled up';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <FadeInView>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Your balance in {group.name}</Text>
            <Text style={styles.heroAmount}>{formatNu(myBalance)}</Text>
            <Text style={styles.heroSub}>
              {myBalance > 0 ? 'The group owes you this amount.'
                : myBalance < 0 ? 'You owe the group this amount.'
                : 'You are all settled up.'}
            </Text>
          </View>
        </FadeInView>

        {loading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !isBalanced ? (
          <Text style={styles.error}>
            Warning: some saved expense data does not add up, so these balances may be off.
          </Text>
        ) : null}

        <FadeInView delay={120}>
          <Text style={styles.sectionTitle}>Everyone's balance</Text>
          <Card>
            {rows.map((uid) => {
              const value = balances[uid] || 0;
              return (
                <View key={uid} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{nameOf(uid)}</Text>
                    <Text style={styles.status}>{statusText(value)}</Text>
                  </View>
                  <Text style={[styles.amount, { color: amountColor(value) }]}>
                    {formatNu(Math.abs(value))}
                  </Text>
                </View>
              );
            })}
          </Card>
        </FadeInView>

        <FadeInView delay={240}>
          <Text style={styles.sectionTitle}>Suggested payments</Text>
          <Card>
            {transfers.length === 0 ? (
              <EmptyState icon="checkmark-circle-outline" title="Everyone is settled up"
                message="No payments are needed right now." />
            ) : (
              transfers.map((transfer) => {
                const key = `${transfer.from}-${transfer.to}`;
                const alreadyReminded = Boolean(reminded[key]);
                return (
                  <View key={key} style={styles.transferRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.transferText}>
                        {nameOf(transfer.from)} pays {nameOf(transfer.to)}
                      </Text>
                      <Text style={styles.transferAmount}>{formatNu(transfer.amount)}</Text>
                    </View>
                    {transfer.to === user.uid && group.memberIds.includes(transfer.from) ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remind ${nameOf(transfer.from)}`}
                        disabled={alreadyReminded}
                        style={[styles.remindButton, alreadyReminded && { opacity: 0.5 }]}
                        onPress={() => handleRemind(transfer)}
                      >
                        <Text style={styles.remindText}>{alreadyReminded ? 'Sent' : 'Remind'}</Text>
                      </Pressable>
                    ) : null}
                    {transfer.from === user.uid && group.memberIds.includes(transfer.to) ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Pay ${nameOf(transfer.to)}`}
                        style={styles.payButton}
                        onPress={() => navigation.navigate('SettleUp', {
                          groupId, toUid: transfer.to, amount: String(transfer.amount),
                        })}
                      >
                        <Text style={styles.payText}>Pay</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })
            )}
          </Card>
          <Text style={styles.note}>
            These are the fewest payments the app found that clear all balances.
          </Text>
        </FadeInView>

        <AppButton title="Record a Payment" onPress={() => navigation.navigate('SettleUp', { groupId })}
          style={{ marginTop: spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  heroCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  heroLabel: { color: colors.white, opacity: 0.85 },
  heroAmount: { color: colors.white, fontSize: 36, fontWeight: '800', marginVertical: spacing.sm },
  heroSub: { color: colors.white, opacity: 0.9 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  name: { fontSize: fontSize.body, fontWeight: '600', color: colors.text },
  status: { color: colors.textMuted, fontSize: fontSize.small },
  amount: { fontSize: fontSize.body, fontWeight: '800' },
  transferRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  transferText: { fontSize: fontSize.body, color: colors.text, fontWeight: '600' },
  transferAmount: { color: colors.primary, fontWeight: '800', marginTop: 2 },
  payButton: {
    minHeight: 44, minWidth: 64, borderRadius: radius.md, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md,
  },
  payText: { color: colors.white, fontWeight: '700' },
  remindButton: {
    minHeight: 44, minWidth: 72, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md,
  },
  remindText: { color: colors.primary, fontWeight: '700' },
  note: { color: colors.textMuted, fontSize: fontSize.small, marginBottom: spacing.sm },
});