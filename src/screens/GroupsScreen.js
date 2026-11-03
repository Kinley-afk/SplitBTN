// "My Groups": live list of the user's groups, plus Create / Join buttons.
import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../components/AppButton';
import GroupCard from '../components/GroupCard';
import EmptyState from '../components/EmptyState';
import FadeInView from '../components/FadeInView';
import { useGroups } from '../context/GroupsContext';
import { colors, spacing, fontSize } from '../constants/theme';

export default function GroupsScreen({ navigation }) {
  const { groups, loading, error } = useGroups();

  const header = (
    <View>
      <Text style={styles.heading}>My Groups</Text>
      <View style={styles.buttonRow}>
        <AppButton title="Create Group" style={styles.rowButton}
          onPress={() => navigation.navigate('CreateGroup')} />
        <AppButton title="Join with Code" variant="outline" style={styles.rowButton}
          onPress={() => navigation.navigate('JoinGroup')} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={groups}
        keyExtractor={(group) => group.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index, 5) * 80}>
            <GroupCard group={item}
              onPress={() => navigation.navigate('GroupDetails', { groupId: item.id })} />
          </FadeInView>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <EmptyState
              icon="people-outline"
              title="No groups yet"
              message="Create a group for your hostel, flat or friends, or join one with an invite code."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  heading: { fontSize: fontSize.title, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  rowButton: { flex: 1 },
  error: { color: colors.danger, marginBottom: spacing.md },
});