import { API_BASE_URL } from './config';
import type { AuthTokens } from '../auth/tokenStorage';

export class LoginError extends Error {}

export async function login(email: string, password: string): Promise<AuthTokens> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new LoginError('Network error. Please check your connection and try again.');
  }

  if (!response.ok) {
    throw new LoginError(
      response.status === 401 || response.status === 400
        ? 'Invalid email or password.'
        : `Login failed (${response.status}).`,
    );
  }

  const data = await response.json();
  if (!data?.access || !data?.refresh) {
    throw new LoginError('Unexpected response from server.');
  }

  return { access: data.access, refresh: data.refresh };
}
