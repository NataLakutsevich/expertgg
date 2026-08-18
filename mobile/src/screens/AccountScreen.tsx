import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { getMe, updateMe, logoutRequest, AccountProfile } from '../api/account';
import { resolveAvatarUrl } from '../api/leaderboard';
import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { colors, formElementWidth } from '../theme/theme';
import InfoModal, { InfoModalVariant } from '../components/InfoModal';

type ModalState = { visible: boolean; variant: InfoModalVariant; title: string; message?: string };
const HIDDEN_MODAL: ModalState = { visible: false, variant: 'success', title: '' };

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
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
      setUsernameInput(me.username);
      setError(null);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadProfile().finally(() => setIsLoading(false));
  }, [loadProfile]);

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

  const handleCancelEdit = () => {
    setPendingAvatarUri(null);
    setUsernameInput(profile?.username ?? '');
    setMode('view');
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
        {mode === 'edit' ? (
          <TouchableOpacity onPress={handleCancelEdit}>
            <Text style={styles.cancelLink}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.topGroup}>
          {isLoading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.avatarWrap}
                disabled={mode !== 'edit'}
                onPress={handlePickAvatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarImage, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}
                {mode === 'edit' ? (
                  <View style={styles.avatarPlusBadge}>
                    <MaterialDesignIcons name="plus" size={14} color={colors.textPrimary} />
                  </View>
                ) : null}
              </TouchableOpacity>

              {mode === 'view' ? (
                <>
                  <Text style={styles.username}>{profile?.username}</Text>
                  <Text style={styles.email}>{profile?.email}</Text>
                  <TouchableOpacity style={styles.editButton} onPress={handleStartEdit}>
                    <MaterialDesignIcons
                      name="pencil-outline"
                      size={16}
                      color={colors.textPrimary}
                    />
                    <Text style={styles.editButtonText}>Edit profile</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TextInput
                  style={styles.usernameInput}
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  placeholder="Username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </>
          )}
        </View>

        {mode === 'edit' ? (
          <TouchableOpacity
            style={[
              styles.saveButton,
              { marginBottom: 90 + insets.bottom },
              isSaving && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        ) : (
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
        )}
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
  cancelLink: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
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
  avatarWrap: {
    width: 96,
    height: 96,
    marginBottom: 8,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  editButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  usernameInput: {
    width: formElementWidth,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  saveButton: {
    width: formElementWidth,
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
