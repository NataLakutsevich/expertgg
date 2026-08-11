import { authFetch } from './http';
import { API_BASE_URL } from './config';

export type LeaderboardEntry = {
  rank: number;
  username: string;
  avatar: string | null;
  gg: number;
  is_current_user: boolean;
  [key: string]: unknown;
};

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const response = await authFetch(`/api/leaderboard/?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to load leaderboard (${response.status}).`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export function resolveAvatarUrl(avatar: string | null): string | null {
  if (!avatar) {
    return null;
  }
  return avatar.startsWith('http') ? avatar : `${API_BASE_URL}${avatar}`;
}
