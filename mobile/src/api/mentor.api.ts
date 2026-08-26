import { api } from './client';
import type { ApiSuccess, IdeaAuthor, User } from '@/types/models';

export interface MentorRequest {
  _id: string;
  recipient: IdeaAuthor | string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message?: string;
  createdAt: string;
}

export const mentorApi = {
  getMentors: (search?: string) =>
    api.get<ApiSuccess<User[]>>('/mentors', {
      params: search ? { search } : undefined,
    }),

  sendMentorRequest: (mentorId: string, message: string) =>
    api.post<ApiSuccess<{ _id: string; status: string }>>(
      `/mentors/${mentorId}/requests`,
      { message }
    ),

  getMyMentorRequests: () =>
    api.get<ApiSuccess<MentorRequest[]>>('/mentors/requests/my'),
};
