import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authStorage, normalizeUser } from './authStorage';

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

      /**
       * Adopt a renewed token pair in BOTH places they are kept.
       *
       * The access token lives in two spots: raw in localStorage/sessionStorage
       * (what the axios interceptor reads) and in this store (what useSocket
       * reads to authenticate the websocket). The refresh path used to write
       * only the storage copy, so the two drifted apart the first time a token
       * was refreshed -- and because the store's copy never changes afterwards,
       * the socket kept presenting the original token until it expired. Every
       * realtime feature then died for the rest of the session: chat, typing
       * indicators, presence and notification toasts, with nothing on screen but
       * "[socket] connection error: Invalid or expired token" in the console.
       */
      setTokens: (token, refreshToken) => {
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        storage.setItem('token', token);
        if (refreshToken) storage.setItem('refreshToken', refreshToken);
        set({ token });
      },
    }),
    {
      name: 'auth-storage',
      storage: authStorage,
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
