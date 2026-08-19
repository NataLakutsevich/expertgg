import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getBetHistory, BetHistoryEntry, BetStatus } from '../api/matches';
import { getMe } from '../api/account';
import { ApiError } from '../api/http';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/theme';
import { useFocusPolling } from '../hooks/useFocusPolling';
import { formatCountdown } from '../utils/countdown';

const POLL_INTERVAL_MS = 15000;
const TICK_INTERVAL_MS = 30000;

const STATUS_LABEL: Record<BetStatus, string> = {
  won: 'Win',
  lost: 'Lose',
  active: 'Active',
};

const STATUS_COLOR: Record<BetStatus, string> = {
  won: '#3ED598',
  lost: colors.danger,
  active: '#F5B417',
};

// For Win/Lose, shows when the match actually finished and the payout was
// resolved (resolved_at) rather than when the bet was originally placed.
// Active bets have no resolved_at yet, so they fall back to created_at.
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function formatDelta(item: BetHistoryEntry): { text: string; color: string } {
  if (item.status === 'won') {
    return { text: `+${item.payout} gg`, color: STATUS_COLOR.won };
  }
  if (item.status === 'lost') {
    return { text: `-${item.stake} gg`, color: STATUS_COLOR.lost };
  }
  return { text: `${item.stake} gg`, color: colors.textMuted };
}

function HistoryCard({ item, now }: { item: BetHistoryEntry; now: number }) {
  const delta = formatDelta(item);

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[item.status] }]}>
          <Text style={[styles.statusBadgeText, { color: STATUS_COLOR[item.status] }]}>
            {STATUS_LABEL[item.status]}
          </Text>
        </View>
        <Text style={styles.tournament} numberOfLines={1}>
          {item.tournament_name} • {item.videogame}
        </Text>
      </View>

      <View style={styles.teamsRow}>
        <Text
          style={[styles.teamName, item.chosen_team === item.team1_name && styles.teamNameChosen]}
          numberOfLines={1}>
          {item.team1_name}
        </Text>
        <Text style={styles.vs}>VS</Text>
        <Text
          style={[styles.teamName, item.chosen_team === item.team2_name && styles.teamNameChosen]}
          numberOfLines={1}>
          {item.team2_name}
        </Text>
      </View>

      <View style={styles.cardBottomRow}>
        {item.status === 'active' ? (
          <Text
            style={[
              styles.date,
              item.match_status === 'running' && styles.matchStateLive,
            ]}>
            {formatCountdown(item.scheduled_at, now, item.match_status)}
          </Text>
        ) : (
          <Text style={styles.date}>{formatDate(item.resolved_at ?? item.created_at)}</Text>
        )}
        <Text style={[styles.delta, { color: delta.color }]}>{delta.text}</Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [history, setHistory] = useState<BetHistoryEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const [entries, profile] = await Promise.all([getBetHistory(), getMe()]);
      setHistory(entries);
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

  useFocusPolling(loadHistory, POLL_INTERVAL_MS);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>History</Text>
        <TouchableOpacity style={styles.balancePill} onPress={() => navigation.navigate('GetCoins')}>
          <Text style={styles.balanceText}>{balance} gg</Text>
          <Image source={require('../assets/icons/money-bag.png')} style={styles.moneyBagIcon} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.centered}>
          <Image
            source={require('../assets/icons/empty-state-swords.png')}
            style={[styles.emptyIcon, { tintColor: colors.textMuted }]}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>No History</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => String(item.id)}
          extraData={now}
          renderItem={({ item }) => <HistoryCard item={item} now={now} />}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tournament: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  teamName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  teamNameChosen: {
    color: colors.primary,
  },
  vs: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
  },
  matchStateLive: {
    color: colors.danger,
    fontWeight: '700',
  },
  delta: {
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});
