import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../auth/AuthContext';
import { LoginError } from '../api/auth';
import { colors, formElementWidth } from '../theme/theme';

const EMAIL_TOP_PERCENT = 0.296;
const PASSWORD_TOP_PERCENT = 0.366;
const INPUT_HEIGHT = 50; // как у Log in, для единообразия
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
    <LinearGradient
      colors={['#001F4F', '#090C15']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.logoRow, { paddingTop: insets.top + 110 }]}>
          <Image
            source={require('../assets/logo/glyph_e.png')}
            style={styles.glyphE}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/icons/empty-state-swords.png')}
            style={styles.logoSwordIcon}
            tintColor={colors.textPrimary}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/logo/glyph_pert.png')}
            style={styles.glyphPert}
            resizeMode="contain"
          />
        </View>

        <TextInput
          style={[styles.input, styles.inputAbsolute, { top: height * EMAIL_TOP_PERCENT }]}
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
          style={[styles.input, styles.inputAbsolute, { top: height * PASSWORD_TOP_PERCENT }]}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
        />
        {error ? (
          <Text style={[styles.error, { top: height * PASSWORD_TOP_PERCENT + 70 }]}>{error}</Text>
        ) : null}

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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', // не 'center' — буквы должны стоять на одной базовой линии
    justifyContent: 'center',
    marginBottom: 40,
  },
  glyphE: {
    height: 24,
    width: 24 * (349 / 365), // ≈ 23
    transform: [{ translateY: -10.7 }], // компенсация нижнего выносного элемента у "p" в "pert"
  },
  glyphPert: {
    height: 40,
    width: 40 * (1246 / 609), // ≈ 81.8
  },
  logoSwordIcon: {
    width: 34,
    height: 34,
    transform: [{ translateY: -6.3 }],
  },
  input: {
    width: formElementWidth,
    height: INPUT_HEIGHT,
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  inputAbsolute: {
    position: 'absolute',
    alignSelf: 'center',
  },
  error: {
    position: 'absolute',
    alignSelf: 'center',
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
    backgroundColor: '#2A4A8A',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
