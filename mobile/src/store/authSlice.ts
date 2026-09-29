import { create } from 'zustand';

import { clearTokens, hasRefreshToken, setTokens } from '@/api/tokenStorage';
import { authApi } from '@/api/auth.api';
import { setAuthClientListener } from '@/api/client';
import type { AuthPayload, User } from '@/types/models';

export type AuthStatus =
  | 'idle'
  | 'hydrating'
  | 'authenticated'
  | 'unauthenticated';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  /**
   * Set when hydrate() could not reach the server, as opposed to finding no
   * session. Those are very different situations for the user -- one is "you
   * need to sign in", the other is "try again" -- and collapsing them sent
   * anyone who opened the app offline to the login screen as if they had been
   * logged out. Only ever set by hydrate(); cleared as soon as it succeeds.
   */
  bootError: boolean;
  setAuth: (payload: AuthPayload) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  hydrate: () => Promise<void>;
}

const normalizeUser = (user?: Partial<User> | null): User | null => {
  if (!user) return null;
  return {
    ...(user as User),
    _id: user._id || user.id || '',
    id: user.id || user._id,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  bootError: false,

  setAuth: async (payload) => {
    await setTokens(payload.token, payload.refreshToken);
    set({ user: normalizeUser(payload.user), status: 'authenticated' });
  },

  logout: () => {
    clearTokens();
    set({ user: null, status: 'unauthenticated' });
  },

  updateUser: (userData) => {
    set((state) => ({
      user: normalizeUser({ ...state.user, ...userData }),
    }));
  },

  hydrate: async () => {
    set({ status: 'hydrating', bootError: false });

    try {
      const hasToken = await hasRefreshToken();
      if (!hasToken) {
        set({ status: 'unauthenticated' });
        return;
      }

      const res = await authApi.getMe();
      set({
        user: normalizeUser(res.data.data),
        status: 'authenticated',
      });
    } catch (error) {
      // No `response` means the request never reached a server: DNS, refused,
      // or the client-side timeout. That is not the same as "no session", so
      // surface it as a retryable boot error instead of showing the login
      // screen. An actual HTTP error is a real answer, so treat it as signed out.
      const unreachable = !(error as { response?: unknown })?.response;
      if (unreachable) {
        set({ status: 'hydrating', bootError: true });
        return;
      }
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));

setAuthClientListener((event) => {
  const store = useAuthStore.getState();
  if (event.type === 'user-refreshed') {
    store.updateUser(event.user);
  } else {
    store.logout();
  }
});
