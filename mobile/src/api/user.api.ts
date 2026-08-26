import { api } from './client';
import type { ApiSuccess, User } from '@/types/models';

export const userApi = {
  getUserById: (userId: string) =>
    api.get<ApiSuccess<User>>(`/users/${userId}`),

  registerPushToken: (token: string, platform: 'ios' | 'android' | 'web') =>
    api.put<ApiSuccess<null>>('/users/me/push-tokens', { token, platform }),

  unregisterPushToken: (token: string) =>
    api.delete<ApiSuccess<null>>(`/users/me/push-tokens/${encodeURIComponent(token)}`),
};
