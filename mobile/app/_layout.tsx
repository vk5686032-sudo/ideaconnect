import '../global.css';

import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
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
import { useEffect } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import Toast from 'react-native-toast-message';

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';

import { colors } from '@/theme/colors';
import {
  showToast,
  toastConfig,
} from '@/components/ToastConfig';
import { useAuthStore } from '@/store/authSlice';
import { usePresenceStore } from '@/store/presenceSlice';
import {
  connectSocket,
  disconnectSocket,
  joinUserRoom,
  onSocketEvent,
} from '@/services/socket';
import { registerPushToken } from '@/services/pushTokens';
import {
  notificationKeys,
  prependNotification,
  useMarkNotificationRead,
} from '@/hooks/queries/useNotifications';
import { resolveActionRoute } from '@/utils/links';
import type { AppNotification } from '@/types/models';

export { ErrorBoundary } from 'expo-router';

function SocketNotificationBridge() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    const off = onSocketEvent('notification', (payload) => {
      const data = payload as { notification?: AppNotification };
      // Every event on this channel is a real Notification row, so the unread
      // count only needs invalidating once one has actually arrived. Chat
      // messages travel on their own 'chat:unread' channel and must not trigger
      // a notification refetch.
      if (!data?.notification) return;
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.unread(),
      });
      prependNotification(queryClient, data.notification);
      const notification = data.notification;
      const route = resolveActionRoute(notification.actionUrl);
      showToast({
        type: 'info',
        text1: notification.title,
        text2: notification.message,
        onAction: () => {
          if (!notification.read) {
            markRead.mutate(notification._id);
          }
          router.push(route ?? { pathname: '/notifications' });
        },
      });
    });
    return off;
  }, [queryClient, router, markRead]);

  return null;
}

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

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

  useEffect(() => {
    if (status === 'authenticated') {
      void (async () => {
        const connected = await connectSocket();
        const user = useAuthStore.getState().user;
        const userId = user?._id || user?.id;
        if (connected && userId) {
          joinUserRoom(userId);
        }
        void registerPushToken();
      })();
    } else if (status === 'unauthenticated') {
      disconnectSocket();
      usePresenceStore.getState().reset();
    }
  }, [status]);

  useEffect(() => {
    const presence = usePresenceStore.getState();
    const offSnapshot = onSocketEvent('presence:snapshot', (ids) => {
      presence.setOnlineIds((ids as string[]) ?? []);
    });
    const offOnline = onSocketEvent('user:online', (userId) => {
      presence.handleOnline(userId as string);
    });
    const offOffline = onSocketEvent('user:offline', (userId) => {
      presence.handleOffline(userId as string);
    });
    return () => {
      offSnapshot();
      offOnline();
      offOffline();
    };
  }, []);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!loaded || status === 'idle' || status === 'hydrating') {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SocketNotificationBridge />
      <ThemeProvider value={isDark ? darkNavTheme : lightNavTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View className={isDark ? 'dark flex-1' : 'flex-1'}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="ideas" options={{ headerShown: false }} />
            <Stack.Screen name="projects" options={{ headerShown: false }} />
            <Stack.Screen name="chat" options={{ headerShown: false }} />
            <Stack.Screen name="users" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="mentors" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
          </Stack>
          <Toast config={toastConfig} topOffset={48} />
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
