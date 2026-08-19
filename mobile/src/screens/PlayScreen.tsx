import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { getMatches, placeBet, BetValidationError, Match } from '../api/matches';
import { getMe } from '../api/account';
import { ApiError } from '../api/http';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/theme';
import { useFocusPolling } from '../hooks/useFocusPolling';
import MatchCard from '../components/MatchCard';
import InfoModal, { InfoModalVariant } from '../components/InfoModal';

const POLL_INTERVAL_MS = 15000;
const TICK_INTERVAL_MS = 1000;

type ModalState = { visible: boolean; variant: InfoModalVariant; title: string; message?: string };

const HIDDEN_MODAL: ModalState = { visible: false, variant: 'success', title: '' };

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalState>(HIDDEN_MODAL);
  const [now, setNow] = useState(() => Date.now());
  const listRef = useRef<FlatList<Match>>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Scroll the just-expanded card to the top so its whole bet panel (stepper,
  // numpad, Vote button) is visible instead of just peeking in at the bottom.
  // The short delay lets the row's expanded layout commit first.
  useEffect(() => {
    if (expandedId == null) {
      return;
    }
    const index = matches.findIndex(m => m.id === expandedId);
    if (index === -1) {
      return;
    }
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
    }, 50);
    return () => clearTimeout(timer);
  }, [expandedId, matches]);

  const loadData = useCallback(async () => {
    try {
      const [allMatches, profile] = await Promise.all([getMatches(), getMe()]);
      // Curator-confirmed: betting is strictly upcoming-only, so running/live
      // matches (no longer bettable) do not belong in the Play list either.
      // Also drop "upcoming" matches whose scheduled_at has already passed —
      // PandaScore/the sync cron can lag up to a minute behind the actual
      // start, and those show a stale "Starting..." countdown in the meantime.
      const now = Date.now();
      const playable = allMatches.filter(
        m => m.status === 'upcoming' && new Date(m.scheduled_at).getTime() > now,
      );
      setMatches(playable);
      setBalance(profile.gg_balance);
      setError(null);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusPolling(loadData, POLL_INTERVAL_MS);

  const handleSubmitBet = useCallback(
    async (match: Match, chosenTeam: string, stake: number) => {
      setIsSubmitting(true);
      try {
        await placeBet({ match_id: match.id, chosen_team: chosenTeam, stake });
        setExpandedId(null);
        setModal({
          visible: true,
          variant: 'success',
          title: 'Bet placed!',
          message: `You bet ${stake} gg on ${chosenTeam}. Win ${stake * 2} gg if they take it.`,
        });
        await loadData();
      } catch (e) {
        const message =
          e instanceof BetValidationError || e instanceof Error
            ? e.message
            : 'Something went wrong.';
        setModal({ visible: true, variant: 'error', title: 'Could not place bet', message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadData],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Play</Text>
        <TouchableOpacity
          style={styles.balancePill}
          onPress={() => navigation.navigate('GetCoins')}>
          <Text style={styles.balanceText}>{balance} gg</Text>
          <Image source={require('../assets/icons/money-bag.png')} style={styles.moneyBagIcon} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.centered}>
          <Image
            source={require('../assets/icons/empty-state-swords.png')}
            style={[styles.emptyIcon, { tintColor: colors.textMuted }]}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>No Matches</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={matches}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          extraData={[expandedId, now, isSubmitting, balance]}
          onScrollToIndexFailed={info => {
            listRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              now={now}
              balance={balance}
              isExpanded={expandedId === item.id}
              isSubmitting={isSubmitting && expandedId === item.id}
              onToggle={() => setExpandedId(prev => (prev === item.id ? null : item.id))}
              onSubmitBet={(chosenTeam, stake) => handleSubmitBet(item, chosenTeam, stake)}
            />
          )}
        />
      )}

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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 32,
    fontWeight: '400',
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});
