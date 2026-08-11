import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useAuth } from '../auth/AuthContext';
import { LoginError } from '../api/auth';
import { colors, formElementWidth } from '../theme/theme';

const LOGO_SIZE = 52;
// Log in button: top = 393/812 ≈ 48.4% of screen height, height = 50dp.
const LOGIN_BUTTON_TOP_PERCENT = 0.484;
const LOGIN_BUTTON_HEIGHT = 50;

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof LoginError ? e.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.logoRow, { paddingTop: insets.top + 48 }]}>
        <Text style={styles.logoText}>e</Text>
        <MaterialDesignIcons name="sword-cross" size={LOGO_SIZE} color={colors.textPrimary} />
        <Text style={styles.logoText}>pert</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!isSubmitting}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { top: height * LOGIN_BUTTON_TOP_PERCENT },
          !canSubmit && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit}>
        {isSubmitting ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.buttonText}>Log in</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoText: {
    color: colors.textPrimary,
    fontSize: LOGO_SIZE,
    fontWeight: '700',
  },
  form: {
    alignItems: 'center',
    gap: 12,
  },
  input: {
    width: formElementWidth,
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  button: {
    position: 'absolute',
    alignSelf: 'center',
    width: formElementWidth,
    height: LOGIN_BUTTON_HEIGHT,
    backgroundColor: colors.primary,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
