import { flattenNotificationPages } from '@/utils/notificationPages';
import type { ApiSuccess, AppNotification } from '@/types/models';
import type { NotificationsPageResult } from '@/api/notification.api';

const notification = (id: string): AppNotification =>
  ({
    _id: id,
    type: 'like',
    title: `n${id}`,
    message: 'm',
    read: false,
    createdAt: '2026-09-27T00:00:00.000Z',
  }) as AppNotification;

const page = (ids: string[], total?: number): ApiSuccess<NotificationsPageResult> => ({
  success: true,
  message: '',
  data: {
    notifications: ids.map(notification),
    total: total ?? ids.length,
    unreadCount: ids.length,
  },
});

const ids = (list: AppNotification[]) => list.map((n) => n._id);

describe('flattenNotificationPages', () => {
  it('returns nothing for an absent cache', () => {
    expect(flattenNotificationPages(undefined)).toEqual([]);
    expect(flattenNotificationPages([])).toEqual([]);
  });

  it('flattens a single page in order', () => {
    expect(ids(flattenNotificationPages([page(['a', 'b'])]))).toEqual(['a', 'b']);
  });

  it('concatenates multiple pages in order', () => {
    expect(ids(flattenNotificationPages([page(['a']), page(['b', 'c'])]))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('drops a notification that appears on two pages', () => {
    // Happens when a create/delete shifts rows between fetches.
    const flat = flattenNotificationPages([page(['a', 'b']), page(['b', 'c'])]);
    expect(ids(flat)).toEqual(['a', 'b', 'c']);
  });

  it('keeps the first occurrence', () => {
    const flat = flattenNotificationPages([page(['a', 'x']), page(['x'])]);
    expect(ids(flat)).toEqual(['a', 'x']);
  });

  it('tolerates a page with a missing notifications array', () => {
    const broken = {
      success: true,
      message: '',
      data: { total: 0, unreadCount: 0 },
    } as unknown as ApiSuccess<NotificationsPageResult>;
    expect(ids(flattenNotificationPages([page(['a']), broken]))).toEqual(['a']);
  });
});
