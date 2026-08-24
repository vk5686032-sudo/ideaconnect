import { useAuthStore } from '@/store/authSlice';

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.status === 'authenticated');
}

export function useAuthStatus() {
  return useAuthStore((state) => state.status);
}

export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}
