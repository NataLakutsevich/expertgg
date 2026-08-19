import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getLeaderboard, resolveAvatarUrl, LeaderboardEntry } from '../api/leaderboard';
import { getMe } from '../api/account';
import { ApiError } from '../api/http';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/theme';
import { useFocusPolling } from '../hooks/useFocusPolling';

const POLL_INTERVAL_MS = 4000;

function LeaderboardRow({ item }: { item: LeaderboardEntry }) {
  const avatarUrl = resolveAvatarUrl(item.avatar);
  const initial = item.username.charAt(0).toUpperCase();

  return (
    <View style={[styles.row, item.is_current_user && styles.rowCurrent]}>
      <Text style={[styles.rank, item.is_current_user && styles.rankCurrent]}>{item.rank}</Text>

      <View style={styles.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitial}>{initial}</Text>
        )}
      </View>

      <Text
        style={[styles.username, item.is_current_user && styles.usernameCurrent]}
        numberOfLines={1}>
        {item.username}
      </Text>

      <Text style={styles.ggText}>{item.gg} gg</Text>
    </View>
  );
}

export default function LeadersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      const [entries, profile] = await Promise.all([getLeaderboard(50), getMe()]);
      setLeaderboard(entries);
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

  useFocusPolling(loadLeaderboard, POLL_INTERVAL_MS);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Leaderboard</Text>
        <TouchableOpacity style={styles.balancePill} onPress={() => navigation.navigate('GetCoins')}>
          <Text style={styles.balanceText}>{balance} gg</Text>
          <Image source={require('../assets/icons/money-bag.png')} style={styles.moneyBagIcon} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : leaderboard.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Пока нет игроков</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={item => String(item.rank)}
          renderItem={({ item }) => <LeaderboardRow item={item} />}
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
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 66,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
  },
  rowCurrent: {
    backgroundColor: colors.surface,
  },
  rank: {
    width: 24,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  rankCurrent: {
    color: colors.primary,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarInitial: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  username: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  usernameCurrent: {
    color: colors.primary,
  },
  ggText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});
