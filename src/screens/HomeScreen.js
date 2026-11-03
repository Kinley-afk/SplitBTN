// Home dashboard shell. Balance figures are real zeros for now;
// they become live once groups and expenses exist (later stages).
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import { useAuth } from '../context/AuthContext';
import { formatNu } from '../utils/formatCurrency';
import { colors, spacing, radius, fontSize } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const firstName = (user?.displayName || 'friend').split(' ')[0];

  // Placeholder totals until the balance module is connected.
  const youOwe = 0;
  const youAreOwed = 0;
  const netBalance = youAreOwed - youOwe;

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
            <Text style={styles.balanceLabel}>Your net balance</Text>
            <Text style={styles.balanceAmount}>{formatNu(netBalance)}</Text>
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.smallLabel}>You owe</Text>
                <Text style={styles.smallAmount}>{formatNu(youOwe)}</Text>
              </View>
              <View>
                <Text style={styles.smallLabel}>You are owed</Text>
                <Text style={styles.smallAmount}>{formatNu(youAreOwed)}</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          <AppButton title="+ Add Expense" onPress={() => navigation.navigate('Groups')} />
        </FadeInView>

        <FadeInView delay={300} style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Your groups</Text>
          <Card>
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyText}>No groups yet. Groups appear here in the next stage.</Text>
            </View>
          </Card>
        </FadeInView>

        <FadeInView delay={400}>
          <Text style={styles.sectionTitle}>Recent expenses</Text>
          <Card>
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyText}>No expenses recorded yet.</Text>
            </View>
          </Card>
        </FadeInView>
      </ScrollView>
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.md },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});