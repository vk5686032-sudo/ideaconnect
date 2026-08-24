import '../global.css';

import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import Toast from 'react-native-toast-message';

import { colors } from '@/theme/colors';
import { toastConfig } from '@/components/ToastConfig';
import { useAuthStore } from '@/store/authSlice';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const lightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.light.tint,
    tint: colors.light.tint,
    background: colors.light.background,
    card: colors.light.surface,
    border: colors.light.border,
    text: colors.light.textPrimary,
  },
};

const darkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.dark.tint,
    tint: colors.dark.tint,
    background: colors.dark.background,
    card: colors.dark.surface,
    border: colors.dark.border,
    text: colors.dark.textPrimary,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && status !== 'idle' && status !== 'hydrating') {
      SplashScreen.hideAsync();
    }
  }, [loaded, status]);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!loaded || status === 'idle' || status === 'hydrating') {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={isDark ? darkNavTheme : lightNavTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View className={isDark ? 'dark flex-1' : 'flex-1'}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
          <Toast config={toastConfig} topOffset={48} />
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
