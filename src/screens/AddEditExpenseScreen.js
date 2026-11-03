// Add a new expense, or edit one (when route.params.expense exists).
// The split preview uses calculateSplit, the same function whose result is saved.
// A new expense also notifies the other group members.
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import SplitPreview from '../components/SplitPreview';
import SuccessOverlay from '../components/SuccessOverlay';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import { getUserProfiles } from '../services/groupService';
import { addExpense, updateExpense, getFriendlyExpenseError } from '../services/expenseService';
import { notifyMembers } from '../services/notificationService';
import { calculateSplit, parseMoney } from '../utils/splitCalculator';
import { validateExpenseTitle, validateAmount, validateExpenseDate } from '../utils/expenseValidation';
import { toDateInput, parseDateInput } from '../utils/dateUtils';
import { formatNu } from '../utils/formatCurrency';
import { CATEGORIES } from '../constants/categories';
import { colors, spacing, fontSize } from '../constants/theme';

const METHODS = [
  { key: 'equal', label: 'Equal' },
  { key: 'exact', label: 'Exact amounts' },
  { key: 'percent', label: 'Percentages' },
];

// When editing an exact/percent expense, refill the per-person boxes.
function initialInputs(expense) {
  if (!expense) return {};
  const source = expense.splitMethod === 'exact' ? expense.shares
    : expense.splitMethod === 'percent' ? expense.percentages : {};
  const inputs = {};
  Object.keys(source).forEach((uid) => { inputs[uid] = String(source[uid]); });
  return inputs;
}

export default function AddEditExpenseScreen({ route, navigation }) {
  const { groupId, expense } = route.params;
  const isEdit = Boolean(expense);
  const { user } = useAuth();
  const { groups } = useGroups();
  const group = groups.find((g) => g.id === groupId);

  const [profiles, setProfiles] = useState({});
  const [title, setTitle] = useState(expense?.title ?? '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [category, setCategory] = useState(expense?.category ?? CATEGORIES[0].key);
  const [dateText, setDateText] = useState(toDateInput(expense ? new Date(expense.dateMs) : new Date()));
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? user.uid);
  const [participantIds, setParticipantIds] = useState(expense?.participantIds ?? group?.memberIds ?? []);
  const [method, setMethod] = useState(expense?.splitMethod ?? 'equal');
  const [inputs, setInputs] = useState(initialInputs(expense));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load member names (only reloads when the member list changes).
  const memberKey = group ? group.memberIds.join(',') : '';
  useEffect(() => {
    if (!group) return;
    let cancelled = false;
    getUserProfiles(group.memberIds).then((result) => { if (!cancelled) setProfiles(result); });
    return () => { cancelled = true; };
  }, [memberKey]);

  // After saving: show the check mark for a moment, then go back.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => navigation.goBack(), 800);
    return () => clearTimeout(timer);
  }, [saved]);

  // Participants in the same order as the member list, so leftover
  // chetrum are always handed out the same way.
  const orderedParticipants = useMemo(
    () => (group ? group.memberIds.filter((id) => participantIds.includes(id)) : []),
    [group, participantIds]
  );

  const result = useMemo(
    () => calculateSplit(method, amount, orderedParticipants, inputs),
    [method, amount, orderedParticipants, inputs]
  );

  if (!group) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const nameOf = (uid) => (profiles[uid]?.displayName || '...') + (uid === user.uid ? ' (You)' : '');

  const toggleParticipant = (uid) =>
    setParticipantIds((current) =>
      current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid]
    );

  // Running total shown under the per-person boxes.
  const assigned = orderedParticipants.reduce((sum, id) => {
    const value = parseMoney(inputs[id]);
    return Number.isNaN(value) ? sum : sum + value;
  }, 0);

  const handleSave = async () => {
    const newErrors = {
      title: validateExpenseTitle(title),
      amount: validateAmount(amount),
      date: validateExpenseDate(dateText),
      split: '',
    };
    if (!newErrors.amount && !result.ok) newErrors.split = result.error;
    if (orderedParticipants.length === 0) newErrors.split = 'Select at least one person to share this expense.';
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        amount: parseMoney(amount),
        category,
        date: parseDateInput(dateText),
        paidBy,
        participantIds: orderedParticipants,
        splitMethod: method,
        shares: result.shares,
        percentages: result.percentages,
      };
      if (isEdit) {
        await updateExpense(groupId, expense.id, data);
      } else {
        await addExpense(groupId, data, user.uid);
        // Not awaited: a notification problem must never block saving.
        notifyMembers({
          groupId,
          recipientIds: group.memberIds,
          fromUid: user.uid,
          type: 'expense',
          title: `New expense in ${group.name}`,
          body: `${user.displayName || 'A member'} added "${data.title}" (${formatNu(data.amount)})`,
        });
      }
      setSaved(true);
    } catch (error) {
      setErrors({ form: getFriendlyExpenseError(error) });
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <AppInput label="Title" value={title} onChangeText={setTitle} error={errors.title}
              placeholder="e.g. Dinner at Zhemgang" maxLength={60} />
            <AppInput label="Amount (Nu.)" value={amount} onChangeText={setAmount} error={errors.amount}
              keyboardType="decimal-pad" placeholder="0.00" />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((item) => (
                <Chip key={item.key} label={item.key} icon={item.icon}
                  selected={category === item.key} onPress={() => setCategory(item.key)} />
              ))}
            </View>

            <View style={{ height: spacing.md }} />
            <AppInput label="Date (YYYY-MM-DD)" value={dateText} onChangeText={setDateText}
              error={errors.date} keyboardType="numbers-and-punctuation" maxLength={10} />
            <View style={[styles.chipRow, { marginTop: -spacing.sm, marginBottom: spacing.md }]}>
              <Chip label="Today" icon="today-outline" onPress={() => setDateText(toDateInput(new Date()))} />
            </View>

            <Text style={styles.label}>Paid by</Text>
            <View style={styles.chipRow}>
              {group.memberIds.map((uid) => (
                <Chip key={uid} label={nameOf(uid)} selected={paidBy === uid} onPress={() => setPaidBy(uid)} />
              ))}
            </View>

            <Text style={[styles.label, styles.sectionGap]}>Split between</Text>
            <View style={styles.chipRow}>
              {group.memberIds.map((uid) => (
                <Chip key={uid} label={nameOf(uid)} icon={participantIds.includes(uid) ? 'checkmark' : undefined}
                  selected={participantIds.includes(uid)} onPress={() => toggleParticipant(uid)} />
              ))}
            </View>

            <Text style={[styles.label, styles.sectionGap]}>Split method</Text>
            <View style={styles.chipRow}>
              {METHODS.map((item) => (
                <Chip key={item.key} label={item.label}
                  selected={method === item.key} onPress={() => setMethod(item.key)} />
              ))}
            </View>

            {method !== 'equal' ? (
              <View style={{ marginTop: spacing.md }}>
                {orderedParticipants.map((uid) => (
                  <AppInput key={uid}
                    label={`${nameOf(uid)} ${method === 'percent' ? '(%)' : '(Nu.)'}`}
                    value={inputs[uid] ?? ''} keyboardType="decimal-pad" placeholder="0"
                    onChangeText={(text) => setInputs((current) => ({ ...current, [uid]: text }))} />
                ))}
                <Text style={styles.assigned}>
                  {method === 'percent'
                    ? `Assigned: ${assigned.toFixed(2)}% of 100%`
                    : `Assigned: ${formatNu(assigned)} of ${formatNu(parseMoney(amount) || 0)}`}
                </Text>
              </View>
            ) : null}

            <View style={{ height: spacing.md }} />
            <SplitPreview result={result} nameOf={nameOf} hasAmount={amount.trim() !== ''} />

            {errors.split ? <Text style={styles.error}>{errors.split}</Text> : null}
            {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}

            <AppButton title={isEdit ? 'Save Changes' : 'Save Expense'} onPress={handleSave} loading={saving} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {saved ? <SuccessOverlay message={isEdit ? 'Expense updated' : 'Expense saved'} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  label: { fontSize: fontSize.small, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  sectionGap: { marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  assigned: { color: colors.textMuted, fontSize: fontSize.small, marginBottom: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.md, fontSize: fontSize.small },
});