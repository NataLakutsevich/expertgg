import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { getMe, updateMe, logoutRequest, AccountProfile } from '../api/account';
import { resolveAvatarUrl } from '../api/leaderboard';
import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, formElementWidth } from '../theme/theme';
import InfoModal, { InfoModalVariant } from '../components/InfoModal';
import { useFocusPolling } from '../hooks/useFocusPolling';

type ModalState = { visible: boolean; variant: InfoModalVariant; title: string; message?: string };
const HIDDEN_MODAL: ModalState = { visible: false, variant: 'success', title: '' };

// Avatar diameter as a fraction of screen width so it scales across devices
// instead of staying a fixed 96dp regardless of resolution.
const AVATAR_SIZE_PERCENT = 0.32;
const POLL_INTERVAL_MS = 15000;

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const avatarSize = width * AVATAR_SIZE_PERCENT;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [usernameInput, setUsernameInput] = useState('');
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(HIDDEN_MODAL);

  const loadProfile = useCallback(async () => {
    try {
      const me = await getMe();
      setProfile(me);
      setError(null);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusPolling(loadProfile, POLL_INTERVAL_MS);

  // Lets the tab bar highlight the Account icon blue only while actively
  // editing, instead of just whenever this tab happens to be focused.
  useEffect(() => {
    (navigation as any).setParams({ isEditing: mode === 'edit' });
  }, [mode, navigation]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutRequest();
    await logout();
  };

  const handlePickAvatar = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      const uri = response.assets?.[0]?.uri;
      if (uri) {
        setPendingAvatarUri(uri);
      }
    });
  };

  const handleStartEdit = () => {
    setUsernameInput(profile?.username ?? '');
    setPendingAvatarUri(null);
    setMode('edit');
  };

  const handleSave = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setModal({
        visible: true,
        variant: 'error',
        title: 'Name required',
        message: 'Enter a username before saving.',
      });
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateMe({
        username: trimmed,
        avatarUri: pendingAvatarUri ?? undefined,
      });
      setProfile(updated);
      setPendingAvatarUri(null);
      setMode('view');
      setModal({ visible: true, variant: 'success', title: 'Profile updated' });
    } catch (e) {
      setModal({
        visible: true,
        variant: 'error',
        title: 'Could not save profile',
        message: e instanceof Error ? e.message : 'Something went wrong.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUrl = pendingAvatarUri ?? resolveAvatarUrl(profile?.avatar ?? null);
  const initial = (profile?.username ?? '?').charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Account</Text>
        <TouchableOpacity style={styles.balancePill} onPress={() => navigation.navigate('GetCoins')}>
          <Text style={styles.balanceText}>{profile?.gg_balance ?? 0} gg</Text>
          <Image source={require('../assets/icons/money-bag.png')} style={styles.moneyBagIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.topGroup}>
          {isLoading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <TouchableOpacity
                style={{ width: avatarSize, height: avatarSize, marginBottom: 8 }}
                disabled={mode !== 'edit'}
                onPress={handlePickAvatar}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    resizeMode="cover"
                    style={[
                      styles.avatarBorder,
                      { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      styles.avatarBorder,
                      { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
                    ]}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}
                {mode === 'edit' ? (
                  <View
                    style={[
                      styles.avatarPlusBadge,
                      {
                        width: avatarSize * 0.32,
                        height: avatarSize * 0.32,
                        borderRadius: (avatarSize * 0.32) / 2,
                      },
                    ]}>
                    <MaterialDesignIcons
                      name="plus"
                      size={avatarSize * 0.18}
                      color="#FFFFFF"
                    />
                  </View>
                ) : null}
              </TouchableOpacity>

              {mode === 'view' ? (
                <>
                  <Text style={styles.username}>{profile?.username}</Text>
                  <Text style={styles.email}>{profile?.email}</Text>
                  <TouchableOpacity style={styles.editButton} onPress={handleStartEdit}>
                    <Image source={require('../assets/icons/edit-pencil.png')} style={styles.editIcon} />
                    <Text style={styles.editButtonText}>Edit profile</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.usernameInput}
                    value={usernameInput}
                    onChangeText={setUsernameInput}
                    placeholder="Username"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}>
                    {isSaving ? (
                      <ActivityIndicator color={colors.textPrimary} />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </>
          )}
        </View>

        {mode === 'view' ? (
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { marginBottom: 90 + insets.bottom },
              isLoggingOut && styles.buttonDisabled,
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}>
            {isLoggingOut ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.logoutButtonText}>Log out</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      <InfoModal
        visible={modal.visible}
        variant={modal.variant}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(HIDDEN_MODAL)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  topGroup: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  avatarBorder: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  avatarPlusBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 17,
    letterSpacing: -0.24,
    marginTop: 24,
  },
  moneyBagIcon: {
    width: 35,
    height: 34,
  },
  username: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  email: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: formElementWidth,
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    marginTop: 8,
  },
  editIcon: {
    width: 18,
    height: 18,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: -0.24,
  },
  usernameInput: {
    width: formElementWidth,
    backgroundColor: 'transparent',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 16,
    marginTop: 24,
  },
  saveButton: {
    width: formElementWidth,
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    width: formElementWidth,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
