import { authFetch } from './http';
import { getRefreshToken } from '../auth/tokenStorage';

export type AccountProfile = {
  username: string;
  email: string;
  avatar: string | null;
  gg_balance: number;
  wins: number;
  losses: number;
  [key: string]: unknown;
};

export async function getMe(): Promise<AccountProfile> {
  const response = await authFetch('/api/account/me/');
  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status}).`);
  }
  return response.json();
}

/**
 * Best-effort server-side logout (blacklists the refresh token). Failures
 * are not fatal — the caller still clears local tokens and signs out.
 */
export async function logoutRequest(): Promise<void> {
  const refresh = await getRefreshToken();
  if (!refresh) {
    return;
  }
  try {
    await authFetch('/api/auth/logout/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
  } catch {
    // ignore — local sign-out still proceeds
  }
}
