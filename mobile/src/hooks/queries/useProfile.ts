import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { mentorApi } from '@/api/mentor.api';
import { userApi, type ProfileUpdatePayload } from '@/api/user.api';
import { useAuthStore } from '@/store/authSlice';

export const userKeys = {
  stats: () => ['users', 'me', 'stats'] as const,
};

export const mentorKeys = {
  all: ['mentors'] as const,
  list: (search?: string) => [...mentorKeys.all, 'list', search ?? ''] as const,
  myRequests: () => [...mentorKeys.all, 'my-requests'] as const,
};

export function useMyStats() {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: async () => {
      const res = await userApi.getMyStats();
      return res.data.data;
    },
  });
}

export function useMentors(search?: string) {
  return useQuery({
    queryKey: mentorKeys.list(search),
    queryFn: async () => {
      const res = await mentorApi.getMentors(search || undefined);
      return res.data.data;
    },
    enabled: true,
  });
}

export function useMyMentorRequests() {
  return useQuery({
    queryKey: mentorKeys.myRequests(),
    queryFn: async () => {
      const res = await mentorApi.getMyMentorRequests();
      return res.data.data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  return useMutation({
    mutationFn: (data: ProfileUpdatePayload) => userApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateAvatar() {
  const updateUser = useAuthStore((state) => state.updateUser);
  return useMutation({
    mutationFn: ({
      uri,
      fileName,
      mimeType,
    }: {
      uri: string;
      fileName: string;
      mimeType: string;
    }) => userApi.updateAvatar(uri, fileName, mimeType),
    onSuccess: (res) => {
      updateUser({ avatar: res.data.data.avatar });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      userApi.changePassword(data),
  });
}

export function useSendMentorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mentorId, message }: { mentorId: string; message: string }) =>
      mentorApi.sendMentorRequest(mentorId, message),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mentorKeys.myRequests() });
    },
  });
}
