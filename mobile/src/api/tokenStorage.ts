import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'ideaconnect.accessToken';
const REFRESH_TOKEN_KEY = 'ideaconnect.refreshToken';

export interface TokenPair {
  accessToken: string | null;
  refreshToken: string | null;
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function hasRefreshToken(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  return Boolean(refreshToken);
}
