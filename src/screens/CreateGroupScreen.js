import React, { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { createGroup, getFriendlyGroupError } from '../services/groupService';
import { validateGroupName } from '../utils/validation';
import { colors, spacing, fontSize } from '../constants/theme';

export default function CreateGroupScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const validationError = validateGroupName(name);
    setError(validationError);
    if (validationError) return;

    setLoading(true);
    try {
      const groupId = await createGroup(name, user);
      // replace() so Back from the details screen returns to the Groups tab.
      navigation.replace('GroupDetails', { groupId });
    } catch (err) {
      setError(getFriendlyGroupError(err));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.sub}>
          Give your group a name. You will get an invite code to share with the others.
        </Text>
        <AppInput label="Group name" value={name} onChangeText={setName} error={error}
          placeholder="e.g. Hostel Block A" maxLength={40} />
        <AppButton title="Create Group" onPress={handleCreate} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg },
  sub: { color: colors.textMuted, fontSize: fontSize.body, marginBottom: spacing.lg },
});