import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { userApi } from '@/api/user.api';

// Remote push requires an EAS build (EXPO_PUBLIC_EAS_PROJECT_ID). Expo Go
// (SDK 53+) THROWS AT IMPORT TIME of expo-notifications on Android, so the
// module is loaded lazily and only outside Expo Go. Every failure path is a
// silent skip — realtime socket notifications cover in-app usage.

function canUsePush(): boolean {
  if (Constants.appOwnership === 'expo') return false;
  return !!process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
}

async function getExpoPushToken(): Promise<string | null> {
  if (!canUsePush()) return null;
  if (!Device.isDevice) return null;

  const Notifications = await import('expo-notifications');

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const request = await Notifications.requestPermissionsAsync();
    status = request.status;
  }
  if (status !== 'granted') return null;

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID as string,
  });
  return tokenResponse.data ?? null;
}

export async function registerPushToken(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await userApi.registerPushToken(token, Platform.OS as 'ios' | 'android');
    console.log('[push] registered');
  } catch (error) {
    console.log('[push] registration skipped:', (error as Error)?.message);
  }
}

export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await userApi.unregisterPushToken(token);
    console.log('[push] unregistered');
  } catch (error) {
    console.log('[push] unregister skipped:', (error as Error)?.message);
  }
}
