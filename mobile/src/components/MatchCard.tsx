import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { Match } from '../api/matches';
import { colors } from '../theme/theme';
import { formatCountdown } from '../utils/countdown';

const STEP = 10;
const MAX_STAKE_DIGITS = 6; // generous upper bound on typed stake length
const BORDER = '#666C7C'; // team box / numpad key outline, per Figma Vote card spec

function TeamLogo({ name, url }: { name: string; url: string }) {
  if (url) {
    return <Image source={{ uri: url }} style={styles.teamLogo} />;
  }
  return (
    <Image
      source={require('../assets/icons/empty-state-swords.png')}
      style={styles.teamLogo}
      tintColor="#FFFFFF"
      resizeMode="contain"
    />
  );
}

const NUMPAD_ROW_1 = ['1', '2', '3', '4', '5', '6'];
const NUMPAD_ROW_2 = ['7', '8', '9', '0'];

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
    if (isExpanded && chosenTeam === team) {
      // Tapping the already-selected team again closes the panel, same as Cancel.
      handleCancel();
      return;
    }
    if (!isExpanded) {
      onToggle();
      setStakeText('1'); // minimum stake, so the stepper never starts on an invalid 0
    }
    setChosenTeam(team);
  };

  const handleCancel = () => {
    setChosenTeam(null);
    setStakeText('');
    onToggle();
  };

  const handleKeyPress = (key: string) => {
    setStakeText(prev => (prev + key).replace(/^0+(?=\d)/, '').slice(0, MAX_STAKE_DIGITS));
  };

  const handleBackspace = () => {
    setStakeText(prev => prev.slice(0, -1));
  };

  const adjustStake = (delta: number) => {
    setStakeText(String(Math.max(1, stake + delta)));
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
            styles.teamBox,
            chosenTeam === match.team1_name && isExpanded && styles.teamBoxSelected,
          ]}
          disabled={!canBet}
          onPress={() => handleSelectTeam(match.team1_name)}>
          <Text style={styles.teamBoxText} numberOfLines={1}>
            {match.team1_name}
          </Text>
          <TeamLogo name={match.team1_name} url={match.team1_logo_url} />
        </TouchableOpacity>

        <Text style={styles.vs}>VS</Text>

        <TouchableOpacity
          style={[
            styles.teamBox,
            chosenTeam === match.team2_name && isExpanded && styles.teamBoxSelected,
          ]}
          disabled={!canBet}
          onPress={() => handleSelectTeam(match.team2_name)}>
          <TeamLogo name={match.team2_name} url={match.team2_logo_url} />
          <Text style={styles.teamBoxText} numberOfLines={1}>
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
      ) : null}

      {isExpanded && canBet ? (
        <View style={styles.betPanel}>
          <Text style={styles.betPanelTitle}>
            {chosenTeam ? `${chosenTeam} wins` : 'Pick a team above'}
          </Text>

          <View style={styles.controlsRow}>
            <View style={styles.stepperBox}>
              <TouchableOpacity style={styles.stepperSide} onPress={() => adjustStake(-STEP)}>
                <Text style={styles.stepperSideText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepperValue}>
                <Text style={styles.stepperValueText}>{stake}</Text>
              </View>
              <TouchableOpacity style={styles.stepperSide} onPress={() => adjustStake(STEP)}>
                <Text style={styles.stepperSideText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.smallButtonGroup}>
              <TouchableOpacity style={styles.smallButton} onPress={handleBackspace}>
                <MaterialDesignIcons name="backspace-outline" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={handleCancel}>
                <Text style={styles.smallButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.numpadRow}>
            <View style={styles.numpadGrid}>
              <View style={styles.numpadGridRow}>
                {NUMPAD_ROW_1.map(key => (
                  <TouchableOpacity
                    key={key}
                    style={styles.keypadKey}
                    onPress={() => handleKeyPress(key)}>
                    <Text style={styles.keypadKeyText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.numpadGridRow}>
                {NUMPAD_ROW_2.map(key => (
                  <TouchableOpacity
                    key={key}
                    style={styles.keypadKey}
                    onPress={() => handleKeyPress(key)}>
                    <Text style={styles.keypadKeyText}>{key}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.keypadKey, styles.keypadKeyWide]}
                  onPress={() => handleKeyPress('00')}>
                  <Text style={styles.keypadKeyText}>00</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.voteButton, voteDisabled && styles.voteButtonDisabled]}
              onPress={handleVote}
              disabled={voteDisabled}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.voteButtonTitle}>Vote</Text>
                  <Text style={styles.voteButtonSubtitle}>win x2gg</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {stakeExceedsBalance ? (
            <Text style={styles.insufficientText}>Not enough gg — your balance is {balance}.</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.timerRow}>
        <View style={styles.timerBadge}>
          <MaterialDesignIcons
            name="clock-outline"
            size={14}
            color={match.status === 'running' ? colors.danger : colors.textMuted}
          />
          <Text style={[styles.timerText, match.status === 'running' && styles.timerTextLive]}>
            {formatCountdown(match.scheduled_at, now, match.status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 0,
    gap: 4,
    overflow: 'hidden',
  },
  tournament: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: -0.24,
    textAlign: 'center',
  },
  videogame: {
    color: '#959595',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 10,
    letterSpacing: -0.24,
    textAlign: 'center',
    marginBottom: 8,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamBox: {
    flex: 1,
    aspectRatio: 141 / 56, // fixed width:height ratio, so it scales with screen width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  teamBoxSelected: {
    borderColor: colors.primary,
  },
  teamBoxText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  teamLogo: {
    width: 22,
    height: 22,
  },
  vs: {
    color: colors.textPrimary,
    fontSize: 15,
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
  timerRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 25,
    backgroundColor: '#090C15',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  timerText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  timerTextLive: {
    color: colors.danger,
    fontWeight: '700',
  },
  betPanel: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 12,
  },
  betPanelTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 12,
    letterSpacing: -0.24,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperBox: {
    flex: 3,
    flexDirection: 'row',
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperSide: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBEBE9',
  },
  stepperSideText: {
    color: '#090C15',
    fontSize: 22,
    fontWeight: '600',
  },
  stepperValue: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepperValueText: {
    color: '#090C15',
    fontSize: 18,
    fontWeight: '700',
  },
  smallButtonGroup: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  numpadGrid: {
    gap: 8,
  },
  numpadGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keypadKey: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyWide: {
    width: 72, // two keys' width plus the gap between them
  },
  keypadKeyText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  voteButton: {
    width: 78,
    height: 74,
    borderRadius: 8,
    backgroundColor: '#FFA800',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  voteButtonDisabled: {
    opacity: 0.4,
  },
  voteButtonTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  voteButtonSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  insufficientText: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
  },
});
