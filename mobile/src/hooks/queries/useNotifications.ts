import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { notificationApi } from '@/api/notification.api';
import type { ApiSuccess, AppNotification } from '@/types/models';
import type { NotificationsPageResult } from '@/api/notification.api';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

const PAGE_SIZE = 20;

type ListCache = ApiSuccess<NotificationsPageResult>;

function mapListCache(
  qc: ReturnType<typeof useQueryClient>,
  transform: (notifications: AppNotification[]) => AppNotification[]
): void {
  qc.setQueryData<ListCache>(notificationKeys.lists(), (old) => {
    if (!old?.data?.notifications) return old;
    return {
      ...old,
      data: {
        ...old.data,
        notifications: transform(old.data.notifications),
      },
    };
  });
}

function adjustUnread(qc: ReturnType<typeof useQueryClient>, delta: number): void {
  qc.setQueryData<ApiSuccess<{ count: number }>>(
    notificationKeys.unread(),
    (old) => {
      const current = old?.data?.count ?? 0;
      const next = Math.max(0, current + delta);
      return { ...(old ?? { success: true as const, message: '', data: { count: 0 } }), data: { count: next } };
    }
  );
}

export function prependNotification(
  qc: ReturnType<typeof useQueryClient>,
  notification: AppNotification
): void {
  qc.setQueryData<ListCache>(notificationKeys.lists(), (old) => {
    if (!old?.data?.notifications) return old;
    if (old.data.notifications.some((item) => item._id === notification._id)) {
      return old;
    }
    return {
      ...old,
      data: {
        ...old.data,
        total: old.data.total + 1,
        notifications: [notification, ...old.data.notifications],
      },
    };
  });
  if (!notification.read) {
    adjustUnread(qc, 1);
  }
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.lists(),
    queryFn: async ({ pageParam }) => {
      const res = await notificationApi.getNotifications({
        page: pageParam,
        limit: PAGE_SIZE,
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce(
        (sum, page) => sum + page.data.notifications.length,
        0
      );
      return fetched < lastPage.data.total ? allPages.length + 1 : undefined;
    },
  });
}

export function useUnreadCount(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const res = await notificationApi.getUnreadCount();
      return res.data.data.count;
    },
    enabled,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onMutate: (id) => {
      let wasUnread = false;
      mapListCache(qc, (items) =>
        items.map((item) => {
          if (item._id !== id || item.read) return item;
          wasUnread = true;
          return { ...item, read: true, readAt: new Date().toISOString() };
        })
      );
      if (wasUnread) adjustUnread(qc, -1);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onMutate: () => {
      mapListCache(qc, (items) =>
        items.map((item) =>
          item.read ? item : { ...item, read: true, readAt: new Date().toISOString() }
        )
      );
      qc.setQueryData<ApiSuccess<{ count: number }>>(notificationKeys.unread(), {
        success: true,
        message: '',
        data: { count: 0 },
      });
    },
  });
}
