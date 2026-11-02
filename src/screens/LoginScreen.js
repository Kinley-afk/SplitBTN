import React, { useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { loginUser, getFriendlyAuthError } from '../services/authService';
import { validateEmail, validatePassword } from '../utils/validation';
import { colors, spacing, fontSize } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const newErrors = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;

    setLoading(true);
    try {
      await loginUser(email, password);
      // No navigation call needed: AuthContext detects the login
      // and RootNavigator switches to the main app automatically.
    } catch (error) {
      setErrors({ form: getFriendlyAuthError(error) });
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>SplitBTN</Text>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Log in to see your shared expenses.</Text>

          <AppInput label="Email" value={email} onChangeText={setEmail} error={errors.email}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@example.com" />
          <AppInput label="Password" value={password} onChangeText={setPassword} error={errors.password}
            secureTextEntry placeholder="Your password" />

          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

          <AppButton title="Log In" onPress={handleLogin} loading={loading} />

          <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkWrap}>
            <Text style={styles.link}>New here? <Text style={styles.linkBold}>Create an account</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  brand: { fontSize: fontSize.hero, fontWeight: '800', color: colors.primary, marginBottom: spacing.lg },
  heading: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  sub: { color: colors.textMuted, marginBottom: spacing.lg, marginTop: spacing.xs },
  formError: { color: colors.danger, marginBottom: spacing.md, fontSize: fontSize.small },
  linkWrap: { alignItems: 'center', marginTop: spacing.lg, padding: spacing.sm },
  link: { color: colors.textMuted },
  linkBold: { color: colors.primary, fontWeight: '700' },
});