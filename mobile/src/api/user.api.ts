import { api } from './client';
import type { ApiSuccess, User } from '@/types/models';

export interface ProfileUpdatePayload {
  name?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  education?: User['education'];
  experience?: User['experience'];
  socialLinks?: NonNullable<User['socialLinks']>;
}

export const userApi = {
  getUserById: (userId: string) =>
    api.get<ApiSuccess<User>>(`/users/${userId}`),

  updateProfile: (data: ProfileUpdatePayload) =>
    api.put<ApiSuccess<User>>('/users/profile', data),

  updateAvatar: (
    fileUri: string,
    fileName: string,
    mimeType: string
  ) => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
    return api.put<ApiSuccess<{ avatar: User['avatar'] }>>(
      '/users/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
    );
  },

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiSuccess<null>>('/users/change-password', data),

  getMyStats: () =>
    api.get<
      ApiSuccess<{
        ideasCount: number;
        projectsCount: number;
        reputation: number;
      }>
    >('/users/me/stats'),

  registerPushToken: (token: string, platform: 'ios' | 'android' | 'web') =>
    api.put<ApiSuccess<null>>('/users/me/push-tokens', { token, platform }),

  unregisterPushToken: (token: string) =>
    api.delete<ApiSuccess<null>>(
      `/users/me/push-tokens/${encodeURIComponent(token)}`
    ),
};
