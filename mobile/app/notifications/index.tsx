import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  AtSign,
  Bell,
  ClipboardList,
  Heart,
  MessageCircle,
  ShieldCheck,
  Star,
  UserPlus,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '@/hooks/queries/useNotifications';
import { resolveActionRoute, fallbackRoute } from '@/utils/links';
import { flattenNotificationPages } from '@/utils/notificationPages';
import { timeAgo, titleCase } from '@/utils/format';
import type { AppNotification, IdeaAuthor, NotificationType } from '@/types/models';

type IconConfig = { icon: typeof Heart; color: string };

const typeIcons: Partial<Record<NotificationType, IconConfig>> = {
  like: { icon: Heart, color: '#ef4444' },
  comment: { icon: MessageCircle, color: '#4f46e5' },
  reply: { icon: MessageCircle, color: '#4f46e5' },
  mention: { icon: AtSign, color: '#8b5cf6' },
  invitation: { icon: UserPlus, color: '#0ea5e9' },
  'join-request': { icon: UserPlus, color: '#0ea5e9' },
  'task-assigned': { icon: ClipboardList, color: '#f59e0b' },
  'mentor-review': { icon: Star, color: '#eab308' },
  'mentor-request': { icon: Star, color: '#eab308' },
  'mentor-request-accepted': { icon: ShieldCheck, color: '#22c55e' },
  'mentor-request-rejected': { icon: ShieldCheck, color: '#9ca3af' },
};

function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
}) {
  const sender: IdeaAuthor | null =
    typeof item.sender === 'string' ? null : (item.sender ?? null);
  const iconConfig = typeIcons[item.type] ?? { icon: Bell, color: '#6366f1' };
  const Icon = iconConfig.icon;

  return (
    <Pressable
      onPress={() => onPress(item)}
      className={`flex-row items-start gap-3 rounded-xl border px-3 py-3 active:bg-gray-50 dark:active:bg-gray-800 ${
        item.read
          ? 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'
          : 'border-primary-100 bg-primary-50 dark:border-primary-500/30 dark:bg-primary-500/10'
      }`}>
      <View>
        <Avatar name={sender?.name ?? '?'} uri={sender?.avatar?.url ?? null} size={40} />
        <View
          className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white dark:border-gray-900 dark:bg-gray-900">
          <Icon size={12} color={iconConfig.color} strokeWidth={2.2} />
        </View>
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            className={`flex-1 text-sm ${
              item.read
                ? 'font-sans-medium text-gray-800 dark:text-gray-200'
                : 'font-sans-bold text-gray-900 dark:text-gray-50'
            }`}>
            {item.title}
          </Text>
          <Text className="font-sans text-[11px] text-gray-400 dark:text-gray-500">
            {timeAgo(item.createdAt)}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          className="mt-0.5 font-sans text-xs leading-snug text-gray-500 dark:text-gray-400">
          {item.message}
        </Text>
        {!item.read ? (
          <Text className="mt-1 font-sans-medium text-[10px] uppercase tracking-wide text-primary-600 dark:text-primary-400">
            {titleCase(item.type)} Â· new
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const query = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = useMemo(
    () => flattenNotificationPages(query.data?.pages),
    [query.data]
  );

  const handlePress = useCallback(
    (item: AppNotification) => {
      if (!item.read) {
        markRead.mutate(item._id);
      }
      // Always navigate: previously an unmapped actionUrl left the row marked
      // read with no navigation at all, so the tap looked broken.
      router.push(resolveActionRoute(item.actionUrl) ?? fallbackRoute());
    },
    [markRead, router]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AppNotification>) => (
      <NotificationRow item={item} onPress={handlePress} />
    ),
    [handlePress]
  );

  const handleMarkAll = () => {
    if ((unreadCount ?? 0) === 0 || markAllRead.isPending) return;
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: 'All notifications marked read' });
      },
    });
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#0b0f19]">
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerRight: () =>
            (unreadCount ?? 0) > 0 ? (
              <Pressable onPress={handleMarkAll} className="pr-1">
                <Text className="font-sans-semibold text-sm text-primary-600 dark:text-primary-400">
                  Mark all read
                </Text>
              </Pressable>
            ) : null,
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerClassName="px-4 pb-6 pt-3"
        ItemSeparatorComponent={() => <View className="h-2" />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor="#4f46e5"
            colors={['#4f46e5']}
          />
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View className="py-3">
              <ActivityIndicator size="small" color="#6366f1" />
            </View>
          ) : null
        }
        ListHeaderComponent={
          (unreadCount ?? 0) > 0 ? (
            <Text className="mb-2 font-sans text-xs text-gray-400 dark:text-gray-500">
              {(unreadCount ?? 0).toString()} unread
            </Text>
          ) : null
        }
        ListEmptyComponent={
          query.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : query.isError ? (
            <ErrorState
              title="Couldn't load notifications"
              onRetry={() => void query.refetch()}
              retrying={query.isFetching}
            />
          ) : (
            <EmptyState
              icon={Bell}
              title="No notifications"
              message="Likes, comments, tasks and invites will show up here."
            />
          )
        }
      />
    </View>
  );
}
