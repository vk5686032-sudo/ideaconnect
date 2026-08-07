import api from './axios';

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  approveMentor: (id) => api.put(`/admin/users/${id}/approve-mentor`),
  toggleBan: (id) => api.put(`/admin/users/${id}/ban`),
  getIdeas: (params) => api.get('/admin/ideas', { params }),
  moderateIdea: (id, action) => api.post(`/admin/ideas/${id}/moderate`, { action }),
  getProjects: (params) => api.get('/admin/projects', { params }),
};

export default adminApi;