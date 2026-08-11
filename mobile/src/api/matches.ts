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

export async function searchForMatch(): Promise<void> {
  const response = await authFetch('/api/matches/search/', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to start matchmaking (${response.status}).`);
  }
}
