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

export type UpdateMePayload = {
  username?: string;
  /** Local file uri picked from the gallery, e.g. from react-native-image-picker. */
  avatarUri?: string;
};

/**
 * PATCH /api/account/me/ — optional profile editing (username and/or avatar).
 * Sent as multipart/form-data so the avatar file can ride along; omit the
 * Content-Type header and let fetch set the multipart boundary itself.
 */
export async function updateMe(payload: UpdateMePayload): Promise<AccountProfile> {
  const formData = new FormData();
  if (payload.username) {
    formData.append('username', payload.username);
  }
  if (payload.avatarUri) {
    const filename = payload.avatarUri.split('/').pop() || 'avatar.jpg';
    const extensionMatch = /\.(\w+)$/.exec(filename);
    const type = extensionMatch ? `image/${extensionMatch[1]}` : 'image/jpeg';
    // React Native's fetch accepts this shape for file uploads; it isn't
    // part of the DOM FormData/Blob typings, hence the cast.
    formData.append('avatar', { uri: payload.avatarUri, name: filename, type } as unknown as Blob);
  }

  const response = await authFetch('/api/account/me/', {
    method: 'PATCH',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Failed to update account (${response.status}).`);
  }
  return response.json();
}

export type GetCoinsResult = { gg_balance: number; reward: number };

/** POST /api/account/get-coins/ — mock "watch an ad" reward. */
export async function getCoins(): Promise<GetCoinsResult> {
  const response = await authFetch('/api/account/get-coins/', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to get coins (${response.status}).`);
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
