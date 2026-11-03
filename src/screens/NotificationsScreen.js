// List of the user's notifications. Tapping one marks it read and opens its group.
import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import { useNotifications } from '../context/NotificationsContext';
import { markAsRead, markAllAsRead } from '../services/notificationService';
import { formatDisplayDate } from '../utils/dateUtils';
import { colors, spacing, radius, fontSize } from '../constants/theme';

const TYPE_ICONS = { expense: 'receipt', payment: 'cash', reminder: 'alarm' };

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { groups } = useGroups();
  const { notifications, unreadCount, loading } = useNotifications();

  const handlePress = (item) => {
    if (!item.read) markAsRead(user.uid, item.id).catch(() => {});
    // Only open the group if the user is still a member of it.
    if (groups.some((g) => g.id === item.groupId)) {
      navigation.navigate('GroupDetails', { groupId: item.groupId });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          unreadCount > 0 ? (
            <Pressable onPress={() => markAllAsRead(user.uid, notifications).catch(() => {})}
              accessibilityRole="button" style={styles.markAll}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => handlePress(item)} accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.body}`}
            style={[styles.row, !item.read && styles.unreadRow]}>
            <View style={styles.icon}>
              <Ionicons name={TYPE_ICONS[item.type] || 'notifications'} size={20} color={colors.white} />
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{formatDisplayDate(item.createdAtMs)}</Text>
            </View>
            {!item.read ? <View style={styles.dot} /> : null}
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <EmptyState icon="notifications-outline" title="No notifications yet"
              message="You will see new expenses, payments and reminders from your groups here." />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  markAll: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginBottom: spacing.sm },
  markAllText: { color: colors.primary, fontWeight: '700' },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  unreadRow: { borderColor: colors.primary },
  icon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, marginHorizontal: spacing.md },
  title: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  body: { color: colors.text, marginTop: 2 },
  time: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
});