import { api } from './client';
import type { ApiSuccess, User } from '@/types/models';

export const userApi = {
  getUserById: (userId: string) =>
    api.get<ApiSuccess<User>>(`/users/${userId}`),
};
