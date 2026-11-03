// Group details: invite code, live member list, leave button.
// The expense history section is added in the next stage.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import { getUserProfiles, leaveGroup, getFriendlyGroupError } from '../services/groupService';
import { colors, spacing, radius, fontSize } from '../constants/theme';

export default function GroupDetailsScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { groups } = useGroups();
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
        </FadeInView>

        <FadeInView delay={120}>
          <Text style={styles.sectionTitle}>Members ({group.memberIds.length})</Text>
          <Card>
            {group.memberIds.map((uid) => {
              const displayName = profiles[uid]?.displayName || '...';
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

        <FadeInView delay={240}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          <Card>
            {/* TEMPORARY: replaced by the real expense history in the next stage */}
            <Text style={styles.placeholder}>Expense tracking is added in the next stage.</Text>
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
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
  placeholder: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
});