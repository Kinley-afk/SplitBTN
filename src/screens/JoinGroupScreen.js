import React, { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { joinGroupByCode, getFriendlyGroupError } from '../services/groupService';
import { validateInviteCode } from '../utils/validation';
import { colors, spacing, fontSize } from '../constants/theme';

export default function JoinGroupScreen({ navigation }) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const validationError = validateInviteCode(code);
    setError(validationError);
    if (validationError) return;

    setLoading(true);
    try {
      const groupId = await joinGroupByCode(code, user.uid);
      navigation.replace('GroupDetails', { groupId });
    } catch (err) {
      setError(getFriendlyGroupError(err));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.sub}>Enter the 6-character code a group member shared with you.</Text>
        <AppInput label="Invite code" value={code}
          onChangeText={(text) => setCode(text.toUpperCase())} error={error}
          autoCapitalize="characters" autoCorrect={false} maxLength={6} placeholder="e.g. K7M2QX" />
        <AppButton title="Join Group" onPress={handleJoin} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg },
  sub: { color: colors.textMuted, fontSize: fontSize.body, marginBottom: spacing.lg },
});