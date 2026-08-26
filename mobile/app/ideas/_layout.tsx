import { Redirect, Stack } from 'expo-router';

import { useAuthStatus } from '@/hooks/useAuth';

export default function IdeasLayout() {
  const status = useAuthStatus();

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    />
  );
}
