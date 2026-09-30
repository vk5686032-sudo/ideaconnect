import axios from 'axios';
import useAuthStore from '../store/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getStoredValue = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getStoredValue('token');
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

/**
 * Has our own access token actually expired?
 *
 * Needed because "401" means two very different things here. When the token is
 * still valid, the 401 is the server rejecting *this request* — a wrong
 * current password, say — and the right move is to surface its message and
 * touch nothing. When the token has expired, the 401 means the session needs
 * renewing like any other.
 *
 * Skipping refresh purely by endpoint cannot tell those apart: listing
 * `/users/change-password` stopped a typo from triggering a refresh, but it
 * also stopped a genuinely expired token from ever refreshing, so the form
 * just failed with "Not authorized to access this route". Reading the JWT's
 * own `exp` separates the two without guessing from the URL.
 */
const isAccessTokenExpired = () => {
  const token = getStoredValue('token');
  if (!token) return true;
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    const exp = JSON.parse(json).exp;
    if (!exp) return true;
    // 5s of slack so a token that dies mid-flight still refreshes.
    return exp * 1000 <= Date.now() + 5000;
  } catch {
    // Unreadable token: treat as expired and let the refresh path deal with it.
    return true;
  }
};

// Full session teardown (store + persisted keys).
// logout() clears token/refreshToken from both storages and rewrites the
// persisted auth envelope to its logged-out state, so nothing else is needed
// here — and removing 'auth-storage' beforehand would be undone by it anyway.
const hardLogout = () => {
  useAuthStore.getState().logout();
  window.location.href = '/login';
};

// Single-flight refresh: concurrent 401s share one /auth/refresh call
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const refreshToken = getStoredValue('refreshToken');
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
        // Update the store too, not just storage. useSocket authenticates the
        // websocket from the store's token, so writing storage only left the
        // socket presenting a token that expired 15 minutes after login, and
        // every realtime feature died silently for the rest of the session.
        useAuthStore.getState().setTokens(data.token, data.refreshToken);
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
      // Our token is still good, so the server rejected this request on its
      // merits — a wrong current password, most likely. Reject as-is: the
      // caller shows the real message, and no refresh or logout happens.
      if (!isAccessTokenExpired()) {
        return Promise.reject(error);
      }

      original._retried = true;

      if (getStoredValue('refreshToken')) {
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
