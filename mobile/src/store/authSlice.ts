import { create } from 'zustand';

import { clearTokens, hasRefreshToken, setTokens } from '@/api/tokenStorage';
import { authApi } from '@/api/auth.api';
import type { AuthPayload, User } from '@/types/models';

export type AuthStatus =
  | 'idle'
  | 'hydrating'
  | 'authenticated'
  | 'unauthenticated';

interface AuthState {
  user: User | null;
  status: AuthStatus;
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
    set({ status: 'hydrating' });

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
    } catch {
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));

export default useAuthStore;
