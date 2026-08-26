import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { useChats } from '@/hooks/queries/useChats';
import { useCurrentUser } from '@/hooks/useAuth';
import { usePresenceStore } from '@/store/presenceSlice';
import { onSocketEvent } from '@/services/socket';
import type { Chat, ChatMessage, IdeaAuthor } from '@/types/models';
import { timeAgo } from '@/utils/format';

function resolveOtherParticipant(
  chat: Chat,
  userId: string
): IdeaAuthor | null {
  const others = chat.participants.filter((participant) => {
    if (typeof participant === 'string') return participant !== userId;
    return (participant._id || participant.id) !== userId;
  });
  const first = others[0];
  return typeof first === 'string' ? null : (first ?? null);
}

function previewOf(message: ChatMessage | string | null | undefined): string {
  if (!message || typeof message === 'string') return 'Say hello 👋';
  if (message.isDeleted) return 'Message deleted';
  if ((message.attachments?.length ?? 0) > 0 && !message.content) {
    return '📎 Attachment';
  }
  return message.content ?? '';
}

export default function ChatScreen() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const userId = currentUser?._id || currentUser?.id || '';
  const chatsQuery = useChats();
  const onlineUserIds = usePresenceStore((state) => state.onlineUserIds);

  const [unread, setUnread] = useState<Record<string, number>>({});

  useEffect(() => {
    const off = onSocketEvent('notification', (payload) => {
      const data = payload as { type?: string; chatId?: string };
      if (data?.type !== 'new_message' || !data.chatId) return;
      setUnread((prev) => ({
        ...prev,
        [data.chatId as string]: (prev[data.chatId as string] ?? 0) + 1,
      }));
    });
    return off;
  }, []);

  const chats = useMemo(() => chatsQuery.data ?? [], [chatsQuery.data]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Chat>) => {
      const isGroup = item.type === 'group';
      const other = isGroup ? null : resolveOtherParticipant(item, userId);
      const displayName = isGroup
        ? (item.name ||
          (typeof item.relatedProject === 'object'
            ? item.relatedProject?.title
            : undefined) ||
          'Team chat')
        : (other?.name ?? 'Direct chat');
      const preview = previewOf(item.lastMessage);
      const timestamp =
        item.lastMessage && typeof item.lastMessage !== 'string'
          ? item.lastMessage.createdAt
          : item.createdAt;
      const isOnline =
        !!other && onlineUserIds.includes(other._id || other.id || '');
      const unreadCount = unread[item._id] ?? 0;
      const avatarUri = isGroup
        ? (item.avatar?.url ?? null)
        : (other?.avatar?.url ?? null);

      return (
        <Pressable
          onPress={() => {
            setUnread((prev) => ({ ...prev, [item._id]: 0 }));
            router.push({ pathname: '/chat/[id]', params: { id: item._id } });
          }}
          className="flex-row items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800">
          <View>
            <Avatar name={displayName} uri={avatarUri} size={46} />
            {!isGroup && isOnline ? (
              <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
            ) : null}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text
                numberOfLines={1}
                className="flex-1 font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
                {displayName}
              </Text>
              <Text className="font-sans text-[11px] text-gray-400 dark:text-gray-500">
                {timeAgo(timestamp)}
              </Text>
            </View>
            <View className="mt-0.5 flex-row items-center justify-between gap-2">
              <Text
                numberOfLines={1}
                className={`flex-1 font-sans text-xs ${
                  unreadCount > 0
                    ? 'font-sans-semibold text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                {preview}
              </Text>
              {unreadCount > 0 ? (
                <View className="h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 dark:bg-primary-500">
                  <Text className="font-sans-semibold text-[10px] leading-none text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      );
    },
    [router, userId, onlineUserIds, unread]
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#0b0f19]">
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerClassName="px-4 pb-6 pt-3"
        ItemSeparatorComponent={() => <View className="h-2" />}
        refreshControl={
          <RefreshControl
            refreshing={chatsQuery.isRefetching}
            onRefresh={() => void chatsQuery.refetch()}
            tintColor="#4f46e5"
            colors={['#4f46e5']}
          />
        }
        ListEmptyComponent={
          chatsQuery.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              message="Start a chat from a teammate's profile or open a project team chat."
            />
          )
        }
      />
    </View>
  );
}
