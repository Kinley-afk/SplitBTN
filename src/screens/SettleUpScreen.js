// Record a payment to another member, and see the payment history.
// Balances update automatically because they are recalculated from the records.
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import SuccessOverlay from '../components/SuccessOverlay';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import useGroupBalances from '../hooks/useGroupBalances';
import { getUserProfiles } from '../services/groupService';
import {
  addSettlement, deleteSettlement, getFriendlySettlementError,
} from '../services/settlementService';
import { parseMoney, toChetrum } from '../utils/splitCalculator';
import { validateAmount } from '../utils/expenseValidation';
import { formatNu } from '../utils/formatCurrency';
import { formatDisplayDate } from '../utils/dateUtils';
import { colors, spacing, fontSize } from '../constants/theme';

export default function SettleUpScreen({ route }) {
  const { groupId, toUid: presetTo, amount: presetAmount } = route.params;
  const { user } = useAuth();
  const { groups } = useGroups();
  const group = groups.find((g) => g.id === groupId);
  const { balances, settlements, loading } = useGroupBalances(groupId);

  const [profiles, setProfiles] = useState({});
  const [toUid, setToUid] = useState(presetTo || '');
  const [amountText, setAmountText] = useState(presetAmount || '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Blocks a second tap from recording the same payment twice.
  const submitting = useRef(false);

  // Names for members and for anyone appearing in the payment history.
  const idsKey = [
    ...(group ? group.memberIds : []),
    ...settlements.flatMap((s) => [s.from, s.to]),
  ].join(',');
  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    getUserProfiles(Array.from(new Set(idsKey.split(',')))).then((result) => {
      if (!cancelled) setProfiles(result);
    });
    return () => { cancelled = true; };
  }, [idsKey]);

  // After saving: show the check mark briefly, then clear the form.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => {
      setSaved(false);
      setToUid('');
      setAmountText('');
    }, 900);
    return () => clearTimeout(timer);
  }, [saved]);

  if (!group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const nameOf = (uid) => (profiles[uid]?.displayName || '...') + (uid === user.uid ? ' (You)' : '');
  const otherMembers = group.memberIds.filter((uid) => uid !== user.uid);
  const myBalance = balances[user.uid] || 0;
  const iOwe = myBalance < 0 ? -myBalance : 0;

  const record = async (amount) => {
    if (submitting.current) return; // already saving
    submitting.current = true;
    setSaving(true);
    try {
      await addSettlement(groupId, { to: toUid, amount }, user.uid);
      setSaved(true);
    } catch (error) {
      setErrors({ form: getFriendlySettlementError(error) });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const handleSave = () => {
    const newErrors = {
      to: toUid ? '' : 'Choose who you paid.',
      amount: validateAmount(amountText),
    };
    setErrors(newErrors);
    if (newErrors.to || newErrors.amount) return;

    const amount = parseMoney(amountText);
    const moreThanOwed = toChetrum(amount) > toChetrum(iOwe);
    Alert.alert(
      'Record this payment?',
      `You paid ${nameOf(toUid).replace(' (You)', '')} ${formatNu(amount)}.` +
        (moreThanOwed ? '\n\nThis is more than you currently owe in this group.' : ''),
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Record', onPress: () => record(amount) },
      ]
    );
  };

  const handleDelete = (settlement) =>
    Alert.alert('Delete this payment?', 'Balances will be recalculated for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteSettlement(groupId, settlement.id);
          } catch (error) {
            Alert.alert('Could not delete', getFriendlySettlementError(error));
          }
        },
      },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.sub}>
              {iOwe > 0
                ? `You currently owe ${formatNu(iOwe)} in this group.`
                : 'Record a payment you made to another member.'}
            </Text>

            <Text style={styles.label}>I paid</Text>
            {otherMembers.length === 0 ? (
              <Text style={styles.muted}>There are no other members in this group yet.</Text>
            ) : (
              <View style={styles.chipRow}>
                {otherMembers.map((uid) => (
                  <Chip key={uid} label={nameOf(uid)} selected={toUid === uid} onPress={() => setToUid(uid)} />
                ))}
              </View>
            )}
            {errors.to ? <Text style={styles.error}>{errors.to}</Text> : null}

            <View style={{ height: spacing.md }} />
            <AppInput label="Amount (Nu.)" value={amountText} onChangeText={setAmountText}
              error={errors.amount} keyboardType="decimal-pad" placeholder="0.00" />

            {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
            <AppButton title="Record Payment" onPress={handleSave} loading={saving} />

            <Text style={styles.sectionTitle}>Payment history</Text>
            <Card>
              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : settlements.length === 0 ? (
                <Text style={styles.muted}>No payments recorded yet.</Text>
              ) : (
                settlements.map((settlement) => (
                  <View key={settlement.id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyText}>
                        {nameOf(settlement.from)} paid {nameOf(settlement.to)}
                      </Text>
                      <Text style={styles.historyDate}>{formatDisplayDate(settlement.dateMs)}</Text>
                    </View>
                    <Text style={styles.historyAmount}>{formatNu(settlement.amount)}</Text>
                    {settlement.createdBy === user.uid ? (
                      <Pressable
                        onPress={() => handleDelete(settlement)}
                        accessibilityRole="button"
                        accessibilityLabel="Delete payment"
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                ))
              )}
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {saved ? <SuccessOverlay message="Payment recorded" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  sub: { color: colors.textMuted, fontSize: fontSize.body, marginBottom: spacing.lg },
  label: { fontSize: fontSize.small, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  muted: { color: colors.textMuted },
  error: { color: colors.danger, marginBottom: spacing.md, fontSize: fontSize.small, marginTop: spacing.xs },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  historyText: { fontSize: fontSize.body, color: colors.text, fontWeight: '600' },
  historyDate: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  historyAmount: { fontWeight: '800', color: colors.primary, marginLeft: spacing.sm },
  deleteButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});