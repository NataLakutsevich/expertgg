import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const REFRESH_TOKEN_KEY = 'auth.refreshToken';

export type AuthTokens = {
  access: string;
  refresh: string;
};

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await AsyncStorage.setMany({
    [ACCESS_TOKEN_KEY]: tokens.access,
    [REFRESH_TOKEN_KEY]: tokens.refresh,
  });
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeMany([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}
