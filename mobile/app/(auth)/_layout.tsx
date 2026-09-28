import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuthStatus } from '@/hooks/useAuth';
import { shouldRedirectAuthenticated } from '@/utils/authGuard';

export default function AuthLayout() {
  const status = useAuthStatus();
  const segments = useSegments();

  if (status === 'authenticated' && shouldRedirectAuthenticated(segments[0])) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
