// Profile and settings: shows account details, edits the display name, logs out.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import { useAuth } from '../context/AuthContext';
import { updateDisplayName, logoutUser } from '../services/authService';
import { validateName } from '../utils/validation';
import { colors, spacing, fontSize } from '../constants/theme';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Hide the "saved" message after 2 seconds.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  const handleSave = async () => {
    const validationError = validateName(name);
    setError(validationError);
    if (validationError) return;

    setSaving(true);
    try {
      await updateDisplayName(name);
      await refreshUser(); // so Home shows the new name immediately
      setSaved(true);
    } catch (err) {
      setError('Could not update your name. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Profile</Text>

        <FadeInView>
          <Card>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </Card>
        </FadeInView>

        <FadeInView delay={120}>
          <Card>
            <AppInput label="Display name" value={name} onChangeText={setName}
              error={error} autoCapitalize="words" placeholder="Your name" />
            <AppButton title="Save Name" onPress={handleSave} loading={saving} />
            {saved ? <Text style={styles.success}>Name updated successfully.</Text> : null}
          </Card>
        </FadeInView>

        <FadeInView delay={240}>
          <AppButton title="Log Out" variant="outline" onPress={logoutUser} />
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg },
  heading: { fontSize: fontSize.title, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  label: { fontSize: fontSize.small, color: colors.textMuted },
  value: { fontSize: fontSize.body, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
  success: { color: colors.success, marginTop: spacing.sm, fontWeight: '600' },
});