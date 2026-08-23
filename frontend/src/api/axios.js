import axios from 'axios';
import useAuthStore from '../store/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Endpoints where a 401 is an expected, user-facing outcome (wrong password,
// unknown email). These must surface as inline errors, never trigger the
// global session-expiry logout.
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/resend-verification',
  '/auth/refresh',
];

// Full session teardown (store + persisted keys)
const hardLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  try {
    localStorage.removeItem('auth-storage');
  } catch {
    /* ignore */
  }
  useAuthStore.getState().logout();
  window.location.href = '/login';
};

// Single-flight refresh: concurrent 401s share one /auth/refresh call
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return Promise.resolve(null);
    }

    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, { refreshToken })
      .then((res) => {
        const data = res.data?.data;
        if (!data?.token || !data?.refreshToken) {
          throw new Error('Malformed refresh response');
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        if (data.user) {
          useAuthStore.getState().updateUser(data.user);
        }
        return data.token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Response interceptor — transparent access-token renewal on 401, then retry.
// Falls back to a full logout when there is no valid refresh token left.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const requestUrl = original.url || '';
    const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) =>
      requestUrl.endsWith(endpoint)
    );
    const status = error.response?.status;

    if (status === 401 && !isAuthRequest && !original._retried) {
      original._retried = true;

      if (localStorage.getItem('refreshToken')) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the original request with the renewed access token
          original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
          return api(original);
        }
      }

      // Nothing left to renew with — session is over
      hardLogout();
    }

    return Promise.reject(error);
  }
);

export default api;
