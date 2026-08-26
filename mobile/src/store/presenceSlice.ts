import { create } from 'zustand';

interface PresenceState {
  onlineUserIds: string[];
  setOnlineIds: (userIds: string[]) => void;
  handleOnline: (userId: string) => void;
  handleOffline: (userId: string) => void;
  reset: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUserIds: [],

  setOnlineIds: (userIds) => set({ onlineUserIds: userIds }),

  handleOnline: (userId) =>
    set((state) =>
      state.onlineUserIds.includes(userId)
        ? state
        : { onlineUserIds: [...state.onlineUserIds, userId] }
    ),

  handleOffline: (userId) =>
    set((state) => ({
      onlineUserIds: state.onlineUserIds.filter((id) => id !== userId),
    })),

  reset: () => set({ onlineUserIds: [] }),
}));
