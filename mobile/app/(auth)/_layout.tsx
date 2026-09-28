import { Redirect, Stack, usePathname } from 'expo-router';

import { useAuthStatus } from '@/hooks/useAuth';
import { shouldRedirectAuthenticated } from '@/utils/authGuard';

export default function AuthLayout() {
  const status = useAuthStatus();
  // usePathname, not useSegments: segments include the '(auth)' group, so
  // segments[0] is the group rather than the screen being rendered.
  const pathname = usePathname();

  if (status === 'authenticated' && shouldRedirectAuthenticated(pathname)) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
