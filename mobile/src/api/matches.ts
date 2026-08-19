import { authFetch } from './http';

export type MatchStatus = 'upcoming' | 'running' | 'finished' | 'cancelled';
export type BetStatus = 'active' | 'won' | 'lost';

export type UserBet = {
  id: number;
  chosen_team: string;
  stake: number;
  status: BetStatus;
  payout: number;
};

export type Match = {
  id: number;
  tournament_name: string;
  videogame: string;
  team1_name: string;
  team1_logo_url: string;
  team2_name: string;
  team2_logo_url: string;
  scheduled_at: string;
  status: MatchStatus;
  winner_name: string | null;
  user_bet: UserBet | null;
};

/** GET /api/matches/ — optionally filtered by status (see docs/requirements_simplified2.md §4). */
export async function getMatches(status?: MatchStatus): Promise<Match[]> {
  const query = status ? `?status=${status}` : '';
  const response = await authFetch(`/api/matches/${query}`);
  if (!response.ok) {
    throw new Error(`Failed to load matches (${response.status}).`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export type PlaceBetPayload = {
  match_id: number;
  chosen_team: string;
  stake: number;
};

export type PlacedBet = {
  id: number;
  match_id: number;
  chosen_team: string;
  stake: number;
  status: BetStatus;
  payout: number;
  created_at: string;
};

/** Field-keyed validation error straight from DRF, e.g. {"stake": "Insufficient gg balance."}. */
export type BetFieldErrors = Record<string, string | string[]>;

function firstErrorMessage(fields: BetFieldErrors): string {
  const value = Object.values(fields)[0];
  if (Array.isArray(value)) {
    return value[0] ?? 'Could not place bet.';
  }
  return value ?? 'Could not place bet.';
}

export class BetValidationError extends Error {
  fields: BetFieldErrors;
  constructor(fields: BetFieldErrors) {
    super(firstErrorMessage(fields));
    this.fields = fields;
  }
}

/** POST /api/bets/ — throws BetValidationError with the server's field errors on 4xx. */
export async function placeBet(payload: PlaceBetPayload): Promise<PlacedBet> {
  const response = await authFetch('/api/bets/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new BetValidationError(data ?? {});
  }
  return data;
}

export type BetHistoryEntry = {
  id: number;
  team1_name: string;
  team2_name: string;
  videogame: string;
  tournament_name: string;
  winner_name: string | null;
  match_status: MatchStatus;
  chosen_team: string;
  stake: number;
  status: BetStatus;
  payout: number;
  created_at: string;
  resolved_at: string | null;
};

/** GET /api/bets/history/ — active, won and lost bets, newest first. */
export async function getBetHistory(): Promise<BetHistoryEntry[]> {
  const response = await authFetch('/api/bets/history/');
  if (!response.ok) {
    throw new Error(`Failed to load bet history (${response.status}).`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
