import { ScrollView, Text, View } from 'react-native';
import { LogOut } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { authApi } from '@/api/auth.api';
import { getRefreshToken } from '@/api/tokenStorage';
import { useAuthStore } from '@/store/authSlice';
import { useCurrentUser } from '@/hooks/useAuth';

const roleBadgeTone = {
  admin: 'error',
  mentor: 'primary',
  user: 'success',
} as const;

export default function ProfileScreen() {
  const user = useCurrentUser();
  const logoutStore = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Server-side revocation failed; local session is cleared regardless.
    } finally {
      logoutStore();
      Toast.show({ type: 'success', text1: 'Logged out' });
    }
  };

  if (!user) {
    return null;
  }

  const displayName = user.name || 'User';

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-[#0b0f19]"
      contentContainerClassName="px-4 pt-4 pb-8 gap-4">
      <Card>
        <View className="flex-row items-center gap-4">
          <Avatar name={displayName} uri={user.avatar?.url} size={64} />
          <View className="flex-1 gap-1">
            <Text className="font-sans-bold text-lg text-gray-900 dark:text-gray-100">
              {displayName}
            </Text>
            <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
              {user.email ?? ''}
            </Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              <Badge label={user.role} tone={roleBadgeTone[user.role] ?? 'neutral'} />
              {typeof user.reputation === 'number' ? (
                <Badge label={`${user.reputation} rep`} tone="warning" />
              ) : null}
            </View>
          </View>
        </View>
        {user.bio ? (
          <Text className="mt-3 font-sans text-sm text-gray-600 dark:text-gray-400">
            {user.bio}
          </Text>
        ) : null}
      </Card>

      <Button
        title="Log Out"
        variant="outline"
        onPress={handleLogout}
      />

      <View className="items-center pt-2">
        <View className="flex-row items-center gap-1.5">
          <LogOut size={12} color="#9ca3af" />
          <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">
            Profile editing arrives in Phase 6 · More screens in Phase 1b
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
