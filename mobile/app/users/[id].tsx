import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { chatApi } from '@/api/chat.api';
import { userApi } from '@/api/user.api';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useAuth';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const userId = currentUser?._id || currentUser?.id || '';
  const [opening, setOpening] = useState(false);

  const userQuery = useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const res = await userApi.getUserById(id);
      return res.data.data;
    },
    enabled: !!id,
  });

  const user = userQuery.data;
  const isSelf = !!user && (user._id || user.id) === userId;

  const startChat = async () => {
    if (!user) return;
    setOpening(true);
    try {
      const res = await chatApi.createOrGetDirectChat(user._id || user.id || '');
      router.replace({ pathname: '/chat/[id]', params: { id: res.data.data._id } });
    } catch (error) {
      let message = 'Failed to start chat.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as { message?: string } | undefined)
          ?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    } finally {
      setOpening(false);
    }
  };

  if (userQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-[#0b0f19]">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (userQuery.isError || !user) {
    return (
      <View className="flex-1 justify-center bg-gray-50 dark:bg-[#0b0f19]">
        <Stack.Screen options={{ title: 'Profile' }} />
        <EmptyState title="User not found" />
        <Button
          title="Go back"
          variant="outline"
          className="mx-6"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />

      <View className="flex-1 bg-gray-50 px-4 py-6 dark:bg-[#0b0f19]">
        <View className="items-center gap-2">
          <Avatar name={user.name} uri={user.avatar?.url ?? null} size={96} />
          <Text className="font-sans-bold text-xl text-gray-900 dark:text-gray-100">
            {user.name}
          </Text>
          {user.role === 'mentor' ? <Badge label="Mentor" tone="success" /> : null}
        </View>

        {user.bio ? (
          <Card className="mt-5">
            <Text className="font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {user.bio}
            </Text>
          </Card>
        ) : null}

        {(user.skills?.length ?? 0) > 0 ? (
          <View className="mt-4">
            <Text className="mb-2 font-sans-medium text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Skills
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {user.skills?.map((skill, index) => (
                <Chip key={`${skill}-${index}`} label={skill} />
              ))}
            </View>
          </View>
        ) : null}

        {!isSelf ? (
          <Button
            title={opening ? 'Opening chat…' : 'Message'}
            className="mt-6"
            loading={opening}
            onPress={() => void startChat()}
          />
        ) : null}
      </View>
    </>
  );
}
