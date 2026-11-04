// Profile and settings: shows account details, edits the display name,
// offline testing switch, logs out.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import FadeInView from '../components/FadeInView';
import { useAuth } from '../context/AuthContext';
import { updateDisplayName, logoutUser } from '../services/authService';
import {
  isSimulatingOffline, setSimulatedOffline, subscribeToNetwork,
} from '../services/networkState';
import { validateName } from '../utils/validation';
import { colors, spacing, fontSize } from '../constants/theme';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(isSimulatingOffline());

  // Keep the switch in step with the real state (it is restored at startup).
  useEffect(() => {
    setSimulateOffline(isSimulatingOffline());
    return subscribeToNetwork(() => setSimulateOffline(isSimulatingOffline()));
  }, []);

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

        <FadeInView delay={200}>
          <Card>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={styles.switchTitle}>Simulate offline mode</Text>
                <Text style={styles.switchHint}>
                  For testing and demos. Turns the connection to the database off so you can
                  see how SplitBTN works without internet.
                </Text>
              </View>
              <Switch
                value={simulateOffline}
                onValueChange={(value) => { setSimulateOffline(value); setSimulatedOffline(value); }}
                trackColor={{ true: colors.primary, false: colors.border }}
                accessibilityLabel="Simulate offline mode"
              />
            </View>
          </Card>
        </FadeInView>

        <FadeInView delay={280}>
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
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  switchHint: { color: colors.textMuted, fontSize: fontSize.small, marginTop: 2 },
});