import api from './axios';

export const taskApi = {
  // Tasks
  getMy: () => api.get('/tasks/my'),
  getByProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  delete: (taskId) => api.delete(`/tasks/${taskId}`),
  reorder: (projectId, tasks) => api.put(`/tasks/reorder`, { projectId, tasks }),
  // Milestones
  addMilestone: (projectId, data) => api.post(`/projects/${projectId}/milestones`, data),
  updateMilestone: (projectId, milestoneId, data) =>
    api.put(`/projects/${projectId}/milestones/${milestoneId}`, data),
  deleteMilestone: (projectId, milestoneId) =>
    api.delete(`/projects/${projectId}/milestones/${milestoneId}`),
};

export default taskApi;