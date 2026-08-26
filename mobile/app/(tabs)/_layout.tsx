import { Redirect, Tabs, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import {
  Bell,
  Bookmark,
  FolderKanban,
  Home,
  Lightbulb,
  MessageCircle,
  User,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { colors } from '@/theme/colors';
import { useAuthStatus } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/queries/useNotifications';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  const status = useAuthStatus();
  const router = useRouter();
  const { data: unreadCount } = useUnreadCount({
    enabled: status === 'authenticated',
  });

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.textSecondary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: '/notifications' })}
              className="pr-1"
              accessibilityLabel="Notifications">
              <View>
                <Bell size={22} color={palette.tint} strokeWidth={2} />
                {(unreadCount ?? 0) > 0 ? (
                  <View className="absolute -right-2 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1">
                    <Text className="font-sans-bold text-[9px] leading-none text-white">
                      {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: 'Ideas',
          tabBarIcon: ({ color, size }) => <Lightbulb color={color} size={size} />,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/ideas/bookmarks')}
              className="pr-1"
              accessibilityLabel="Bookmarked ideas">
              <Bookmark size={22} color={palette.tint} strokeWidth={2} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => <FolderKanban color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
