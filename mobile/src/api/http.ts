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

async function refreshAccessToken(): Promise<string | null> {
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
    await saveTokens({ access: data.access, refresh });
    return data.access;
  } catch {
    return null;
  }
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
