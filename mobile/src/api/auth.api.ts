import { api } from './client';
import type { ApiSuccess, AuthPayload, User } from '@/types/models';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiSuccess<AuthPayload>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiSuccess<AuthPayload>>('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post<ApiSuccess<AuthPayload>>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    api.post<ApiSuccess<null>>('/auth/logout', { refreshToken }),

  logoutAll: () => api.post<ApiSuccess<null>>('/auth/logout-all'),

  getMe: () => api.get<ApiSuccess<User>>('/auth/me'),

  verifyEmail: (token: string) =>
    api.get<ApiSuccess<{ verified: boolean }>>(`/auth/verify-email/${token}`),

  forgotPassword: (email: string) =>
    api.post<ApiSuccess<null>>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.put<ApiSuccess<AuthPayload>>(`/auth/reset-password/${token}`, {
      password,
    }),

  resendVerification: (email: string) =>
    api.post<ApiSuccess<null>>('/auth/resend-verification', { email }),
};
