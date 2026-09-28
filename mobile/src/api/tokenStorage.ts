import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'ideaconnect.accessToken';
const REFRESH_TOKEN_KEY = 'ideaconnect.refreshToken';

export interface TokenPair {
  accessToken: string | null;
  refreshToken: string | null;
}

// expo-secure-store has no web implementation (its web build exports `{}`, so
// getItemAsync is undefined and calling it throws before the first screen
// renders). Mirror the web app's own authStorage and use localStorage there.
//
// ponytail: browser storage is NOT a secure enclave — any script on the origin
// can read it. This exists so `npm run web` runs at all; the iOS/Android path
// stays on Keychain/Keystore. Replace with an httpOnly cookie session if the
// web build ever carries anything but demo data.
const isWeb = Platform.OS === 'web';

export async function getAccessToken(): Promise<string | null> {
  if (isWeb) return localStorage.getItem(ACCESS_TOKEN_KEY);
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  if (isWeb) return localStorage.getItem(REFRESH_TOKEN_KEY);
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  if (isWeb) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function hasRefreshToken(): Promise<boolean> {
  const token = await getRefreshToken();
  return Boolean(token);
}
