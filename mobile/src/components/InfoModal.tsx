import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { colors, formElementWidth } from '../theme/theme';

export type InfoModalVariant = 'success' | 'error';

type Props = {
  visible: boolean;
  variant: InfoModalVariant;
  title: string;
  message?: string;
  onClose: () => void;
};

const VARIANT_ICON: Record<InfoModalVariant, { name: 'check-circle' | 'alert-circle'; color: string }> = {
  success: { name: 'check-circle', color: colors.primary },
  error: { name: 'alert-circle', color: colors.danger },
};

/**
 * Generic post-action confirmation/error modal — used after every actionable
 * click (place bet, get coins, save profile, ...) per the assignment's
 * "best practice: a modal after every actionable click" requirement.
 */
export default function InfoModal({ visible, variant, title, message, onClose }: Props) {
  const icon = VARIANT_ICON[variant];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <MaterialDesignIcons name={icon.name} size={48} color={icon.color} />
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 12, 21, 0.72)',
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
    textAlign: 'center',
  },
  message: {
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
