import api from './axios';

export const chatApi = {
  createDirect: (recipientId) => api.post('/chats/direct', { recipientId }),
  createGroup: (data) => api.post('/chats/group', data),
  getMy: () => api.get('/chats'),
  getById: (id) => api.get(`/chats/${id}`),
  getMessages: (id, params) => api.get(`/chats/${id}/messages`, { params }),
  sendMessage: (id, data) => api.post(`/chats/${id}/messages`, data),
  markAsRead: (id) => api.post(`/chats/${id}/read`),
  addParticipant: (id, userId) => api.post(`/chats/${id}/participants`, { userId }),
  leave: (id) => api.post(`/chats/${id}/leave`),
};

export default chatApi;
