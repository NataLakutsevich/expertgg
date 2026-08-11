import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { getLeaderboard, resolveAvatarUrl, LeaderboardEntry } from '../api/leaderboard';
import { ApiError } from '../api/http';
import { colors } from '../theme/colors';

function LeaderboardRow({ item }: { item: LeaderboardEntry }) {
  const avatarUrl = resolveAvatarUrl(item.avatar);

  return (
    <View style={[styles.row, item.is_current_user && styles.rowCurrent]}>
      <Text style={styles.rank}>{item.rank}</Text>

      <View style={styles.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <MaterialDesignIcons name="account" size={20} color={colors.textSecondary} />
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      const entries = await getLeaderboard(50);
      setLeaderboard(entries);
      setError(null);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadLeaderboard().finally(() => setIsLoading(false));
  }, [loadLeaderboard]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Leaders</Text>

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
  header: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowCurrent: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  rank: {
    width: 24,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  username: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  usernameCurrent: {
    color: colors.accent,
  },
  ggText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});
