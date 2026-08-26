import { Redirect, Tabs, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Bookmark, FolderKanban, Home, Lightbulb, MessageCircle, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { colors } from '@/theme/colors';
import { useAuthStatus } from '@/hooks/useAuth';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  const status = useAuthStatus();
  const router = useRouter();

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
