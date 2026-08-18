import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import NetInfo from '@react-native-community/netinfo';
import { useIsConnected } from '../hooks/useIsConnected';
import { colors, formElementWidth } from '../theme/theme';

/**
 * Mounted once at the app root (see App.tsx) so a lost connection is caught
 * everywhere, not just on screens that happen to make a request. Renders
 * nothing until NetInfo reports a real "offline" state.
 */
export default function NoInternetOverlay() {
  const isConnected = useIsConnected();

  if (isConnected !== false) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <MaterialDesignIcons name="wifi-off" size={48} color={colors.textMuted} />
          <Text style={styles.title}>No internet connection</Text>
          <Text style={styles.subtitle}>Check your connection and try again.</Text>
          <TouchableOpacity style={styles.button} onPress={() => NetInfo.fetch()}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 12, 21, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '82%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    width: formElementWidth,
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
