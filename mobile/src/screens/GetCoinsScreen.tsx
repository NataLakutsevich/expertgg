import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { getMe, getCoins } from '../api/account';
import { ApiError } from '../api/http';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, formElementWidth } from '../theme/theme';
import InfoModal, { InfoModalVariant } from '../components/InfoModal';

type ModalState = { visible: boolean; variant: InfoModalVariant; title: string; message?: string };
const HIDDEN_MODAL: ModalState = { visible: false, variant: 'success', title: '' };

export default function GetCoinsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [modal, setModal] = useState<ModalState>(HIDDEN_MODAL);

  const loadBalance = useCallback(async () => {
    try {
      const profile = await getMe();
      setBalance(profile.gg_balance);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) {
        // Non-fatal here — the balance just won't refresh; the header still works.
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const handleGetCoins = async () => {
    setIsClaiming(true);
    try {
      const result = await getCoins();
      setBalance(result.gg_balance);
      setModal({
        visible: true,
        variant: 'success',
        title: 'Coins added!',
        message: `+${result.reward} gg — your new balance is ${result.gg_balance} gg.`,
      });
    } catch (e) {
      setModal({
        visible: true,
        variant: 'error',
        title: 'Could not get coins',
        message: e instanceof Error ? e.message : 'Something went wrong.',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialDesignIcons name="chevron-left" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get coins</Text>
        <View style={styles.balancePill}>
          <MaterialDesignIcons name="wallet-outline" size={16} color={colors.textPrimary} />
          <Text style={styles.balanceText}>{isLoading ? '…' : `${balance} gg`}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Free Coins</Text>
          <MaterialDesignIcons name="cash-multiple" size={56} color="#F5B417" style={styles.coinIcon} />
          <TouchableOpacity
            style={[styles.claimButton, isClaiming && styles.claimButtonDisabled]}
            onPress={handleGetCoins}
            disabled={isClaiming}>
            {isClaiming ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <MaterialDesignIcons name="video-outline" size={18} color={colors.background} />
                <Text style={styles.claimButtonText}>Get coins</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  balanceText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  coinIcon: {
    marginVertical: 4,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: formElementWidth,
    backgroundColor: '#F5B417',
    borderRadius: 30,
    paddingVertical: 14,
  },
  claimButtonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
});
