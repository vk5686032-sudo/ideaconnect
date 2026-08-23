import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth API returns the user with `id`; components use `_id`.
// Normalize so both are always present.
const normalizeUser = (user) => {
  if (!user) return user;
  return {
    ...user,
    _id: user._id || user.id,
    id: user.id || user._id,
  };
};

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken) => {
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({ user: normalizeUser(user), token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: normalizeUser({ ...state.user, ...userData }),
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Normalize the user rehydrated from localStorage (old persisted sessions
      // may only have `id`).
      merge: (persisted, current) => {
        const state = { ...current, ...persisted };
        if (state.user) {
          state.user = normalizeUser(state.user);
        }
        return state;
      },
    }
  )
);

export default useAuthStore;
