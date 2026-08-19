import { API_BASE_URL } from './config';
import { getAccessToken, getRefreshToken, saveTokens } from '../auth/tokenStorage';
import { triggerForcedLogout } from '../auth/authEvents';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function doRefreshAccessToken(): Promise<string | null> {
  const refresh = await getRefreshToken();
  if (!refresh) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (!data?.access) {
      return null;
    }
    // The backend rotates refresh tokens (ROTATE_REFRESH_TOKENS) and
    // blacklists the old one on use, so the response always carries a new
    // refresh token that must replace the stored one — reusing the old
    // (now-blacklisted) refresh here caused the next refresh cycle to fail
    // and force-logout the user roughly every access-token lifetime.
    await saveTokens({ access: data.access, refresh: data.refresh ?? refresh });
    return data.access;
  } catch {
    return null;
  }
}

// Screens routinely fire more than one authFetch at once (e.g. Play loads
// getMatches()+getMe() together via Promise.all). If the access token has
// just expired, every one of them hits 401 at the same moment and would
// otherwise each call the refresh endpoint independently — since refresh
// tokens rotate and the old one is blacklisted on use, only the first of
// those concurrent calls succeeds and every other one gets a "blacklisted
// token" error, wrongly force-logging out a user whose session is actually
// fine. Sharing one in-flight refresh across all concurrent callers fixes
// that: everyone awaits the same network call and the same new tokens.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function requestWithToken(path: string, options: RequestInit, token: string | null) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/**
 * Authenticated fetch. On a 401 it tries a single token refresh and retries
 * once; if that also fails, it forces a logout (session is unrecoverable).
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = await getAccessToken();
  let response = await requestWithToken(path, options, accessToken);

  if (response.status === 401) {
    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) {
      triggerForcedLogout();
      throw new ApiError('Session expired. Please log in again.', 401);
    }

    response = await requestWithToken(path, options, newAccessToken);
    if (response.status === 401) {
      triggerForcedLogout();
      throw new ApiError('Session expired. Please log in again.', 401);
    }
  }

  return response;
}
