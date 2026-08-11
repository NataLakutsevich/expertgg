import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentMatch, Match } from '../api/matches';
import { ApiError } from '../api/http';
import { colors } from '../theme/theme';

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentMatch = useCallback(async () => {
    try {
      const current = await getCurrentMatch();
      setMatch(current);
      setError(null);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadCurrentMatch().finally(() => setIsLoading(false));
  }, [loadCurrentMatch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Play</Text>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.textPrimary} />
          </View>
        ) : match ? (
          <View style={styles.centered}>
            <Text style={styles.statusText}>Match status: {match.status}</Text>
          </View>
        ) : (
          <View style={[styles.emptyState, { marginTop: height * 0.34 }]}>
            <Image
              source={require('../assets/icons/empty-state-swords.png')}
              style={[styles.emptyIcon, { tintColor: colors.textMuted }]}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>No Matches</Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});
