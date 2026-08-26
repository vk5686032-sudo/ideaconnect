import { api } from './client';
import type {
  ApiPaginated,
  ApiSuccess,
  JoinRequest,
  Milestone,
  Project,
  ProjectStatus,
  ProjectVisibility,
} from '@/types/models';

export interface ProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: Exclude<ProjectStatus, 'pending-approval' | 'rejected' | 'cancelled'>;
}

export const projectApi = {
  getProjects: (filters: ProjectFilters = {}) =>
    api.get<ApiPaginated<Project>>('/projects', { params: filters }),

  getMyProjects: () => api.get<ApiSuccess<Project[]>>('/projects/my/projects'),

  getProjectById: (id: string) =>
    api.get<ApiSuccess<Project>>(`/projects/${id}`),

  createProject: (data: {
    title: string;
    description: string;
    technologies: string[];
    visibility: ProjectVisibility;
  }) => api.post<ApiSuccess<Project>>('/projects', data),

  deleteProject: (id: string) =>
    api.delete<ApiSuccess<null>>(`/projects/${id}`),

  requestToJoin: (id: string, message: string) =>
    api.post<ApiSuccess<JoinRequest>>(`/projects/${id}/join-request`, {
      message,
    }),

  getJoinRequests: (id: string) =>
    api.get<ApiSuccess<JoinRequest[]>>(`/projects/${id}/invitations`),

  handleJoinRequest: (invitationId: string, action: 'accept' | 'reject') =>
    api.post<ApiSuccess<null>>(
      `/projects/invitations/${invitationId}/${action}`
    ),

  updateProgress: (id: string, progress: number) =>
    api.put<ApiSuccess<{ progress: number }>>(`/projects/${id}/progress`, {
      progress,
    }),

  addMilestone: (
    projectId: string,
    data: { title: string; description?: string }
  ) =>
    api.post<ApiSuccess<Milestone[]>>(`/projects/${projectId}/milestones`, data),

  updateMilestone: (
    projectId: string,
    milestoneId: string,
    data: { completed?: boolean; title?: string }
  ) =>
    api.put<ApiSuccess<Milestone[]>>(
      `/projects/${projectId}/milestones/${milestoneId}`,
      data
    ),
};
