import type { NotificationsPageResult } from '@/api/notification.api';
import type { ApiSuccess, AppNotification } from '@/types/models';

type ListPage = ApiSuccess<NotificationsPageResult>;

/**
 * Flatten paginated notification pages into a single list, newest first.
 *
 * Dedupe by `_id` is required: any create/delete shifts positions between
 * fetches, so the same notification can appear on two cached pages. The
 * backend does not guarantee unique ids in the display list, and rendering a
 * React key twice corrupts the list.
 */
export const flattenNotificationPages = (
  pages: ListPage[] | undefined
): AppNotification[] => {
  if (!pages?.length) return [];
  const seen = new Set<string>();
  const out: AppNotification[] = [];
  for (const page of pages) {
    for (const notification of page?.data?.notifications ?? []) {
      if (seen.has(notification._id)) continue;
      seen.add(notification._id);
      out.push(notification);
    }
  }
  return out;
};
