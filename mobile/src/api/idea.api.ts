import { api } from './client';
import type {
  ApiPaginated,
  ApiSuccess,
  Idea,
  IdeaCategory,
  IdeaComment,
  IdeaSort,
  IdeaStatus,
  IdeaVisibility,
  MentorReview,
} from '@/types/models';

export interface IdeaFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: IdeaCategory;
  status?: Exclude<IdeaStatus, 'draft' | 'pending-approval' | 'rejected'>;
  sort?: IdeaSort;
}

export interface IdeaWritePayload {
  title: string;
  description: string;
  category: IdeaCategory;
  tags: string[];
  requiredSkills: string[];
  visibility: IdeaVisibility;
  status: 'open' | 'draft';
}

export const ideaApi = {
  getIdeas: (filters: IdeaFilters = {}) =>
    api.get<ApiPaginated<Idea>>('/ideas', { params: filters }),

  getIdeaById: (id: string) => api.get<ApiSuccess<Idea>>(`/ideas/${id}`),

  createIdea: (data: IdeaWritePayload) =>
    api.post<ApiSuccess<Idea>>('/ideas', data),

  updateIdea: (id: string, data: Partial<IdeaWritePayload>) =>
    api.put<ApiSuccess<Idea>>(`/ideas/${id}`, data),

  deleteIdea: (id: string) => api.delete<ApiSuccess<null>>(`/ideas/${id}`),

  toggleLike: (id: string) =>
    api.post<ApiSuccess<{ likesCount: number; isLiked: boolean }>>(
      `/ideas/${id}/like`
    ),

  toggleBookmark: (id: string) =>
    api.post<ApiSuccess<{ isBookmarked: boolean }>>(`/ideas/${id}/bookmark`),

  getMyBookmarks: () => api.get<ApiSuccess<Idea[]>>('/ideas/my/bookmarks'),

  addMentorReview: (id: string, data: { review: string; rating: number }) =>
    api.post<ApiSuccess<{ mentorReviews: MentorReview[] }>>(
      `/ideas/${id}/review`,
      data
    ),

  getComments: (ideaId: string) =>
    api.get<ApiSuccess<IdeaComment[]>>(`/ideas/${ideaId}/comments`),

  addComment: (ideaId: string, data: { content: string; parentId?: string }) =>
    api.post<ApiSuccess<IdeaComment>>(`/ideas/${ideaId}/comments`, data),

  deleteComment: (commentId: string) =>
    api.delete<ApiSuccess<null>>(`/ideas/comments/${commentId}`),

  likeComment: (commentId: string) =>
    api.post<ApiSuccess<{ likesCount: number; isLiked: boolean }>>(
      `/ideas/comments/${commentId}/like`
    ),
};
