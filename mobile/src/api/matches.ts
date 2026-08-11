import { authFetch } from './http';

export type MatchStatus = 'searching' | 'active' | 'finished';

export type Match = {
  id: number;
  status: MatchStatus;
  [key: string]: unknown;
};

export async function getCurrentMatch(): Promise<Match | null> {
  const response = await authFetch('/api/matches/current/');
  if (!response.ok) {
    throw new Error(`Failed to load current match (${response.status}).`);
  }
  const data = await response.json();
  return data ?? null;
}

export type MatchResult = 'win' | 'loss';

export type MatchHistoryEntry = {
  id: number;
  opponent: string;
  result: MatchResult;
  score: string;
  date: string;
  [key: string]: unknown;
};

export async function getMatchHistory(): Promise<MatchHistoryEntry[]> {
  const response = await authFetch('/api/matches/history/');
  if (!response.ok) {
    throw new Error(`Failed to load match history (${response.status}).`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
