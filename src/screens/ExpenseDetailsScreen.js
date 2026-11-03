// One expense in full: amount, payer, split and each person's share.
// It reads the expense live, so edits appear immediately after saving.
// Only the creator sees the Edit and Delete buttons.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import useGroupExpenses from '../hooks/useGroupExpenses';
import { getUserProfiles } from '../services/groupService';
import { deleteExpense, getFriendlyExpenseError } from '../services/expenseService';
import { formatNu } from '../utils/formatCurrency';
import { formatDisplayDate } from '../utils/dateUtils';
import { colors, spacing, fontSize } from '../constants/theme';

const METHOD_LABELS = { equal: 'Split equally', exact: 'Exact amounts', percent: 'Percentages' };

export default function ExpenseDetailsScreen({ route, navigation }) {
  const { groupId, expenseId } = route.params;
  const { user } = useAuth();
  const { groups } = useGroups();
  const { expenses, loading } = useGroupExpenses(groupId);
  const [profiles, setProfiles] = useState({});
  const [deleting, setDeleting] = useState(false);

  const group = groups.find((g) => g.id === groupId);
  const expense = expenses.find((e) => e.id === expenseId);

  const memberKey = group ? group.memberIds.join(',') : '';
  useEffect(() => {
    if (!group) return;
    let cancelled = false;
    getUserProfiles(group.memberIds).then((result) => { if (!cancelled) setProfiles(result); });
    return () => { cancelled = true; };
  }, [memberKey]);

  if (!expense) {
    return (
      <View style={styles.center}>
        {loading || deleting ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <Text style={styles.gone}>This expense no longer exists.</Text>
            <AppButton title="Go Back" variant="outline" onPress={() => navigation.goBack()}
              style={{ marginTop: spacing.md, alignSelf: 'stretch' }} />
          </>
        )}
      </View>
    );
  }

  const nameOf = (uid) => (profiles[uid]?.displayName || '...') + (uid === user.uid ? ' (You)' : '');
  const isCreator = expense.createdBy === user.uid;

  const doDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpense(groupId, expense.id);
      navigation.goBack();
    } catch (error) {
      setDeleting(false);
      Alert.alert('Could not delete', getFriendlyExpenseError(error));
    }
  };

  const handleDelete = () =>
    Alert.alert('Delete expense?', `"${expense.title}" will be removed for everyone in the group.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <FadeInView>
          <Text style={styles.title}>{expense.title}</Text>
          <Text style={styles.amount}>{formatNu(expense.amount)}</Text>
          <Card>
            <Row label="Category" value={expense.category} />
            <Row label="Date" value={formatDisplayDate(expense.dateMs)} />
            <Row label="Paid by" value={nameOf(expense.paidBy)} />
            <Row label="Added by" value={nameOf(expense.createdBy)} />
            <Row label="Split method" value={METHOD_LABELS[expense.splitMethod] || expense.splitMethod} />
          </Card>
        </FadeInView>

        <FadeInView delay={120}>
          <Text style={styles.sectionTitle}>Each person's share</Text>
          <Card>
            {expense.participantIds.map((uid) => (
              <Row key={uid} label={nameOf(uid)}
                value={formatNu(expense.shares[uid] ?? 0) +
                  (expense.splitMethod === 'percent' ? `  (${expense.percentages[uid]}%)` : '')} />
            ))}
          </Card>
        </FadeInView>

        {isCreator ? (
          <FadeInView delay={240}>
            <AppButton title="Edit Expense"
              onPress={() => navigation.navigate('AddExpense', { groupId, expense })} />
            <AppButton title="Delete Expense" variant="outline" onPress={handleDelete}
              loading={deleting} style={{ marginTop: spacing.sm }} />
          </FadeInView>
        ) : (
          <Text style={styles.note}>Only {nameOf(expense.createdBy)} can edit or delete this expense.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  gone: { color: colors.textMuted, fontSize: fontSize.body },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.text },
  amount: { fontSize: 36, fontWeight: '800', color: colors.primary, marginVertical: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  rowLabel: { color: colors.textMuted, fontSize: fontSize.body, flexShrink: 1 },
  rowValue: { color: colors.text, fontWeight: '600', fontSize: fontSize.body, marginLeft: spacing.md },
  note: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});