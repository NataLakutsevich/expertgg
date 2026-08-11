import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { getCurrentMatch, Match } from '../api/matches';
import { ApiError } from '../api/http';
import { colors } from '../theme/colors';

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
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
          <ActivityIndicator color={colors.textPrimary} />
        ) : match ? (
          <Text style={styles.statusText}>Match status: {match.status}</Text>
        ) : (
          <>
            <MaterialDesignIcons name="sword-cross" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No Matches</Text>
          </>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  emptyText: {
    color: colors.textSecondary,
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
