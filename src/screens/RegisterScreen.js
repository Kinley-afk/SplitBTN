import React, { useState } from 'react';
import {
  Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { registerUser, getFriendlyAuthError } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { validateName, validateEmail, validatePassword } from '../utils/validation';
import { colors, spacing, fontSize } from '../constants/theme';

export default function RegisterScreen({ navigation }) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const newErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: password !== confirm ? 'Passwords do not match.' : '',
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    try {
      await registerUser(name, email, password);
      await refreshUser(); // pick up the display name that was just saved
    } catch (error) {
      setErrors({ form: getFriendlyAuthError(error) });
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.sub}>Start splitting expenses with friends.</Text>

          <AppInput label="Full name" value={name} onChangeText={setName} error={errors.name}
            autoCapitalize="words" placeholder="Your name" />
          <AppInput label="Email" value={email} onChangeText={setEmail} error={errors.email}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@example.com" />
          <AppInput label="Password" value={password} onChangeText={setPassword} error={errors.password}
            secureTextEntry placeholder="At least 6 characters" />
          <AppInput label="Confirm password" value={confirm} onChangeText={setConfirm} error={errors.confirm}
            secureTextEntry placeholder="Repeat password" />

          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

          <AppButton title="Register" onPress={handleRegister} loading={loading} />

          <Pressable onPress={() => navigation.goBack()} style={styles.linkWrap}>
            <Text style={styles.link}>Already registered? <Text style={styles.linkBold}>Log in</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  heading: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  sub: { color: colors.textMuted, marginBottom: spacing.lg, marginTop: spacing.xs },
  formError: { color: colors.danger, marginBottom: spacing.md, fontSize: fontSize.small },
  linkWrap: { alignItems: 'center', marginTop: spacing.lg, padding: spacing.sm },
  link: { color: colors.textMuted },
  linkBold: { color: colors.primary, fontWeight: '700' },
});