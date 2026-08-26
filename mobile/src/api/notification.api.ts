import { api } from './client';
import type { ApiSuccess, AppNotification } from '@/types/models';

export interface NotificationsPageResult {
  notifications: AppNotification[];
  total: number;
}

export const notificationApi = {
  getNotifications: (params: { page?: number; limit?: number } = {}) =>
    api.get<ApiSuccess<NotificationsPageResult>>('/notifications', { params }),

  getUnreadCount: () =>
    api.get<ApiSuccess<{ count: number }>>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.put<ApiSuccess<AppNotification>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<ApiSuccess<null>>('/notifications/read-all'),
};
