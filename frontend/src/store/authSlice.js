import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const authStorage = {
  getItem: (name) => localStorage.getItem(name) || sessionStorage.getItem(name),
  setItem: (name, value) => {
    const { state } = JSON.parse(value);
    const storage = state.rememberMe ? localStorage : sessionStorage;
    const otherStorage = state.rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem(name);
    storage.setItem(name, value);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

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
      rememberMe: true,

      setAuth: (user, token, refreshToken, rememberMe = true) => {
        const storage = rememberMe ? localStorage : sessionStorage;
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        otherStorage.removeItem('token');
        otherStorage.removeItem('refreshToken');
        storage.setItem('token', token);
        if (refreshToken) {
          storage.setItem('refreshToken', refreshToken);
        }
        set({ user: normalizeUser(user), token, isAuthenticated: true, rememberMe });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        set({ user: null, token: null, isAuthenticated: false, rememberMe: true });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: normalizeUser({ ...state.user, ...userData }),
        }));
      },
    }),
    {
      name: 'auth-storage',
      storage: { getItem: authStorage.getItem, setItem: authStorage.setItem, removeItem: authStorage.removeItem },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
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
