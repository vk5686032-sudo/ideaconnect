import { Redirect, Stack } from 'expo-router';

import { useAuthStatus } from '@/hooks/useAuth';

export default function AuthLayout() {
  const status = useAuthStatus();

  if (status === 'authenticated') {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
