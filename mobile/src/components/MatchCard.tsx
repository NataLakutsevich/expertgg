import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { Match } from '../api/matches';
import { colors } from '../theme/theme';

const STEP = 10;
const MAX_STAKE_DIGITS = 6; // generous upper bound on typed stake length

function formatCountdown(scheduledAt: string, now: number, status: Match['status']): string {
  if (status === 'running') {
    return 'LIVE';
  }
  const target = new Date(scheduledAt).getTime();
  const diffMs = target - now;
  if (Number.isNaN(target) || diffMs <= 0) {
    return 'Starting...';
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min`;
  return `${seconds} sec`;
}

function TeamLogo({ name, url }: { name: string; url: string }) {
  if (url) {
    return <Image source={{ uri: url }} style={styles.teamLogo} />;
  }
  return (
    <View style={[styles.teamLogo, styles.teamLogoFallback]}>
      <Text style={styles.teamLogoInitial}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const KEYPAD_ROWS: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['00', '0', 'back'],
];

type Props = {
  match: Match;
  now: number;
  balance: number;
  isExpanded: boolean;
  isSubmitting: boolean;
  onToggle: () => void;
  onSubmitBet: (chosenTeam: string, stake: number) => void;
};

export default function MatchCard({
  match,
  now,
  balance,
  isExpanded,
  isSubmitting,
  onToggle,
  onSubmitBet,
}: Props) {
  const [chosenTeam, setChosenTeam] = useState<string | null>(null);
  const [stakeText, setStakeText] = useState('');

  // Collapsing this card (Cancel, or another card taking over as the single
  // expanded one) clears any in-progress, unsubmitted selection.
  useEffect(() => {
    if (!isExpanded) {
      setChosenTeam(null);
      setStakeText('');
    }
  }, [isExpanded]);

  const stake = Number(stakeText) || 0;
  const canBet = match.status === 'upcoming' && !match.user_bet;

  const handleSelectTeam = (team: string) => {
    if (!canBet) {
      return;
    }
    if (!isExpanded) {
      onToggle();
    }
    setChosenTeam(team);
  };

  const handleCancel = () => {
    setChosenTeam(null);
    setStakeText('');
    onToggle();
  };

  const handleKeyPress = (key: string) => {
    if (key === 'back') {
      setStakeText(prev => prev.slice(0, -1));
      return;
    }
    setStakeText(prev => (prev + key).replace(/^0+(?=\d)/, '').slice(0, MAX_STAKE_DIGITS));
  };

  const adjustStake = (delta: number) => {
    setStakeText(String(Math.max(0, stake + delta)));
  };

  const handleVote = () => {
    if (!chosenTeam || stake <= 0) {
      return;
    }
    onSubmitBet(chosenTeam, stake);
  };

  const stakeExceedsBalance = stake > balance;
  const voteDisabled = !chosenTeam || stake <= 0 || stakeExceedsBalance || isSubmitting;

  return (
    <View style={styles.card}>
      <Text style={styles.tournament} numberOfLines={1}>
        {match.tournament_name || match.videogame}
      </Text>
      <Text style={styles.videogame} numberOfLines={1}>
        {match.videogame}
      </Text>

      <View style={styles.teamsRow}>
        <TouchableOpacity
          style={[
            styles.teamColumn,
            chosenTeam === match.team1_name && isExpanded && styles.teamColumnSelected,
          ]}
          disabled={!canBet}
          onPress={() => handleSelectTeam(match.team1_name)}>
          <TeamLogo name={match.team1_name} url={match.team1_logo_url} />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.team1_name}
          </Text>
        </TouchableOpacity>

        <Text style={styles.vs}>VS</Text>

        <TouchableOpacity
          style={[
            styles.teamColumn,
            chosenTeam === match.team2_name && isExpanded && styles.teamColumnSelected,
          ]}
          disabled={!canBet}
          onPress={() => handleSelectTeam(match.team2_name)}>
          <TeamLogo name={match.team2_name} url={match.team2_logo_url} />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.team2_name}
          </Text>
        </TouchableOpacity>
      </View>

      {match.user_bet ? (
        <View style={styles.betBadge}>
          <MaterialDesignIcons name="check-circle-outline" size={14} color={colors.primary} />
          <Text style={styles.betBadgeText}>
            Your bet: {match.user_bet.chosen_team} • {match.user_bet.stake} gg
          </Text>
        </View>
      ) : (
        <View style={styles.timerRow}>
          <MaterialDesignIcons
            name="clock-outline"
            size={14}
            color={match.status === 'running' ? colors.danger : colors.textMuted}
          />
          <Text
            style={[styles.timerText, match.status === 'running' && styles.timerTextLive]}>
            {formatCountdown(match.scheduled_at, now, match.status)}
          </Text>
        </View>
      )}

      {isExpanded && canBet ? (
        <View style={styles.betPanel}>
          <Text style={styles.betPanelTitle}>
            {chosenTeam ? `${chosenTeam} wins` : 'Pick a team above'}
          </Text>

          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepperButton} onPress={() => adjustStake(-STEP)}>
              <Text style={styles.stepperButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{stake} gg</Text>
            <TouchableOpacity style={styles.stepperButton} onPress={() => adjustStake(STEP)}>
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keypad}>
            {KEYPAD_ROWS.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map(key => (
                  <TouchableOpacity
                    key={key}
                    style={styles.keypadKey}
                    onPress={() => handleKeyPress(key)}>
                    {key === 'back' ? (
                      <MaterialDesignIcons
                        name="backspace-outline"
                        size={18}
                        color={colors.textPrimary}
                      />
                    ) : (
                      <Text style={styles.keypadKeyText}>{key}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {stakeExceedsBalance ? (
            <Text style={styles.insufficientText}>Not enough gg — your balance is {balance}.</Text>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.voteButton, voteDisabled && styles.voteButtonDisabled]}
              onPress={handleVote}
              disabled={voteDisabled}>
              {isSubmitting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.voteButtonText}>
                  {chosenTeam && stake > 0 ? `Vote — win ${stake * 2} gg` : 'Vote'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  tournament: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  videogame: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  teamColumnSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 111, 224, 0.12)',
  },
  teamLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  teamLogoFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoInitial: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  teamName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 110,
  },
  vs: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  timerText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  timerTextLive: {
    color: colors.danger,
    fontWeight: '700',
  },
  betBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  betBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  betPanel: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  betPanelTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  stepperValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 90,
    textAlign: 'center',
  },
  keypad: {
    gap: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keypadKey: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  insufficientText: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  voteButton: {
    flex: 1.4,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5B417',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButtonDisabled: {
    opacity: 0.4,
  },
  voteButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
});
