import { api } from './client';
import type { ApiSuccess, ProjectTask, TaskPriority, TaskStatus } from '@/types/models';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedTo?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export const taskApi = {
  getMyTasks: () => api.get<ApiSuccess<ProjectTask[]>>('/tasks/my'),

  getProjectTasks: (projectId: string) =>
    api.get<ApiSuccess<ProjectTask[]>>(`/projects/${projectId}/tasks`),

  createTask: (projectId: string, data: CreateTaskPayload) =>
    api.post<ApiSuccess<ProjectTask>>(`/projects/${projectId}/tasks`, data),

  updateTask: (
    taskId: string,
    data: Partial<{ status: TaskStatus; priority: TaskPriority; title: string }>
  ) => api.put<ApiSuccess<ProjectTask>>(`/tasks/${taskId}`, data),

  deleteTask: (taskId: string) => api.delete<ApiSuccess<null>>(`/tasks/${taskId}`),
};
