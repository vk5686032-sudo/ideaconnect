import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
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

type ListPage = ApiSuccess<NotificationsPageResult>;

// The list is an INFINITE query, so its cache value is
// { pages: ListPage[], pageParams: number[] }. Every writer must preserve that
// wrapper: the observer destructures `pages` on every render, so a bare
// envelope makes it throw while computing next-page params.
type ListCache = InfiniteData<ListPage, number>;

const emptyPage = (): ListPage => ({
  success: true,
  message: '',
  data: { notifications: [], total: 0, unreadCount: 0 },
});

const seedCache = (notifications: AppNotification[]): ListCache => ({
  pages: [
    {
      ...emptyPage(),
      data: {
        notifications,
        total: notifications.length,
        unreadCount: notifications.filter((n) => !n.read).length,
      },
    },
  ],
  pageParams: [1],
});

// Applies `transform` to the notifications on the first page, leaving the rest
// of the pagination state untouched.
function mapFirstPage(
  qc: ReturnType<typeof useQueryClient>,
  transform: (notifications: AppNotification[]) => AppNotification[]
): void {
  qc.setQueryData<ListCache>(notificationKeys.lists(), (old) => {
    if (!old?.pages?.length) return seedCache(transform([]));
    const [first, ...rest] = old.pages;
    return {
      ...old,
      pages: [
        { ...first, data: { ...first.data, notifications: transform(first.data.notifications) } },
        ...rest,
      ],
      pageParams: old.pageParams,
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
    if (!old?.pages?.length) return seedCache([notification]);

    const [first, ...rest] = old.pages;
    if (first.data.notifications.some((item) => item._id === notification._id)) {
      return old;
    }
    return {
      ...old,
      pages: [
        {
          ...first,
          data: {
            ...first.data,
            total: first.data.total + 1,
            unreadCount: notification.read
              ? first.data.unreadCount
              : first.data.unreadCount + 1,
            notifications: [notification, ...first.data.notifications],
          },
        },
        ...rest,
      ],
      pageParams: old.pageParams,
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
      mapFirstPage(qc, (items) =>
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
      mapFirstPage(qc, (items) =>
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
