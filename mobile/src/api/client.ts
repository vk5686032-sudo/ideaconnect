import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/api/tokenStorage';
import { API_URL } from '@/utils/constants';
import type { ApiSuccess, AuthPayload, User } from '@/types/models';
import axios from 'axios';

const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/resend-verification',
  '/auth/refresh',
];

export type AuthClientEvent =
  | { type: 'user-refreshed'; user: User }
  | { type: 'session-expired' };

type AuthClientListener = (event: AuthClientEvent) => void;

let authClientListener: AuthClientListener | null = null;

export function setAuthClientListener(listener: AuthClientListener | null): void {
  authClientListener = listener;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessTokenNow(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      try {
        const res = await axios.post<ApiSuccess<AuthPayload>>(
          `${API_URL}/auth/refresh`,
          { refreshToken }
        );
        const data = res.data?.data;
        if (!data?.token || !data?.refreshToken) {
          throw new Error('Malformed refresh response');
        }
        await setTokens(data.token, data.refreshToken);
        if (data.user) {
          authClientListener?.({ type: 'user-refreshed', user: data.user });
        }
        return data.token;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function refreshAccessToken(): Promise<string | null> {
  return refreshAccessTokenNow();
}

async function hardLogout(): Promise<void> {
  if (!authClientListener) {
    await clearTokens();
  } else {
    authClientListener({ type: 'session-expired' });
  }
}

interface RetriableRequestConfig {
  _retried?: boolean;
  url?: string;
  headers?: Record<string, string>;
}

export function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some((endpoint) => url.endsWith(endpoint));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {} as RetriableRequestConfig;
    const requestUrl = original.url ?? '';
    const status = error.response?.status;

    if (
      status === 401 &&
      !isAuthEndpoint(requestUrl) &&
      !original._retried
    ) {
      original._retried = true;

      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${newToken}`,
          };
          return api(original);
        }
      }

      await hardLogout();
    }

    return Promise.reject(error);
  }
);
