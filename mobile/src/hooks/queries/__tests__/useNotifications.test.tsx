import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  notificationKeys,
  prependNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/hooks/queries/useNotifications';
import type { AppNotification } from '@/types/models';

const notification = (id: string, over: Partial<AppNotification> = {}): AppNotification =>
  ({
    _id: id,
    type: 'like',
    title: `n${id}`,
    message: 'm',
    read: false,
    createdAt: '2026-09-27T00:00:00.000Z',
    ...over,
  }) as AppNotification;

// What useInfiniteQuery actually stores: an InfiniteData wrapper.
const infiniteCache = (notifications: AppNotification[]) => ({
  pages: [
    {
      success: true as const,
      message: '',
      data: { notifications, total: notifications.length, unreadCount: notifications.length },
    },
  ],
  pageParams: [1],
});

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

// The mutation hooks call useQueryClient(), so they must run inside a provider.
// Rendering them also means the real observer recomputes next-page params —
// which is exactly where the bare-envelope cache used to throw.
const wrapper =
  (qc: QueryClient) =>
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };

const runMarkRead = (qc: QueryClient, id: string) => {
  const { result } = renderHook(() => useMarkNotificationRead(), {
    wrapper: wrapper(qc),
  });
  act(() => result.current.mutate(id));
};

const runMarkAllRead = (qc: QueryClient) => {
  const { result } = renderHook(() => useMarkAllNotificationsRead(), {
    wrapper: wrapper(qc),
  });
  act(() => result.current.mutate());
};

const seed = (qc: QueryClient, notifications: AppNotification[]) => {
  qc.setQueryData(notificationKeys.lists(), infiniteCache(notifications));
};

const readPages = (qc: QueryClient) => {
  const cached = qc.getQueryData<{ pages?: unknown[]; pageParams?: unknown[] }>(
    notificationKeys.lists()
  );
  return cached?.pages;
};

describe('notification list cache', () => {
  it('survives a socket push without corrupting the infinite-query shape', () => {
    const qc = makeClient();
    seed(qc, [notification('a')]);

    prependNotification(qc, notification('b'));

    // The observer destructures `pages` on every render; a bare envelope here
    // makes query.data.pages.flatMap(...) throw in the notifications screen.
    const pages = readPages(qc);
    expect(Array.isArray(pages)).toBe(true);
    expect(pages).toHaveLength(1);
  });

  it('prepends the new notification to the first page', () => {
    const qc = makeClient();
    seed(qc, [notification('a')]);

    prependNotification(qc, notification('b'));

    const first = readPages(qc)?.[0] as { data: { notifications: AppNotification[] } };
    expect(first.data.notifications.map((n) => n._id)).toEqual(['b', 'a']);
  });

  it('increments the total so pagination still asks for more', () => {
    const qc = makeClient();
    seed(qc, [notification('a')]);

    prependNotification(qc, notification('b'));

    const first = readPages(qc)?.[0] as { data: { total: number } };
    expect(first.data.total).toBe(2);
  });

  it('ignores a duplicate push for a notification already present', () => {
    const qc = makeClient();
    seed(qc, [notification('a')]);

    prependNotification(qc, notification('a'));

    const first = readPages(qc)?.[0] as { data: { notifications: AppNotification[] } };
    expect(first.data.notifications.map((n) => n._id)).toEqual(['a']);
  });

  it('seeds an empty cache rather than leaving it malformed', () => {
    const qc = makeClient();
    // Nothing fetched yet — the push arrives first.
    prependNotification(qc, notification('a'));

    const pages = readPages(qc);
    expect(Array.isArray(pages)).toBe(true);
    const first = pages?.[0] as { data: { notifications: AppNotification[] } };
    expect(first.data.notifications.map((n) => n._id)).toEqual(['a']);
  });
});

describe('mark as read', () => {
  it('keeps the cache shape and flips the matching row', () => {
    const qc = makeClient();
    seed(qc, [notification('a'), notification('b')]);

    runMarkRead(qc, 'a');

    const pages = readPages(qc);
    expect(Array.isArray(pages)).toBe(true);
    const first = pages?.[0] as { data: { notifications: AppNotification[] } };
    expect(first.data.notifications.find((n) => n._id === 'a')?.read).toBe(true);
    expect(first.data.notifications.find((n) => n._id === 'b')?.read).toBe(false);
  });

  it('leaves the cache shape intact when marking everything read', () => {
    const qc = makeClient();
    seed(qc, [notification('a'), notification('b', { read: true })]);

    runMarkAllRead(qc);

    const pages = readPages(qc);
    expect(Array.isArray(pages)).toBe(true);
    const first = pages?.[0] as { data: { notifications: AppNotification[] } };
    expect(first.data.notifications.every((n) => n.read)).toBe(true);
  });

  it('decrements the unread count only for a row that was actually unread', () => {
    const qc = makeClient();
    seed(qc, [notification('a')]);
    qc.setQueryData(notificationKeys.unread(), {
      success: true,
      message: '',
      data: { count: 1 },
    });

    runMarkRead(qc, 'a');

    const unread = qc.getQueryData<{ data: { count: number } }>(
      notificationKeys.unread()
    );
    expect(unread?.data.count).toBe(0);
  });

  it('does not push the unread count below zero', () => {
    const qc = makeClient();
    seed(qc, [notification('a', { read: true })]);
    qc.setQueryData(notificationKeys.unread(), {
      success: true,
      message: '',
      data: { count: 0 },
    });

    runMarkRead(qc, 'a');

    const unread = qc.getQueryData<{ data: { count: number } }>(
      notificationKeys.unread()
    );
    expect(unread?.data.count).toBe(0);
  });
});
