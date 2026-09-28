import api from './axios';

const projectApi = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  updateMemberRole: (id, userId, role) => api.put(`/projects/${id}/members/${userId}/role`, { role }),
  requestToJoin: (id, data) => api.post(`/projects/${id}/join-request`, data),
  getInvitations: (id, params) => api.get(`/projects/${id}/invitations`, { params }),
  handleInvitation: (invitationId, action) => api.post(`/projects/invitations/${invitationId}/${action}`),
  updateProgress: (id, progress) => api.put(`/projects/${id}/progress`, { progress }),
  getMy: () => api.get('/projects/my/projects'),
};

export default projectApi;
