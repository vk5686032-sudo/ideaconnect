import api from './axios';

export const chatApi = {
  createDirect: (recipientId) => api.post('/chats/direct', { recipientId }),
  createGroup: (data) => api.post('/chats/group', data),
  getMy: () => api.get('/chats'),
  getById: (id) => api.get(`/chats/${id}`),
  getMessages: (id, params) => api.get(`/chats/${id}/messages`, { params }),
  sendMessage: (id, data) => api.post(`/chats/${id}/messages`, data),
  sendAttachment: (id, formData) =>
    api.post(`/chats/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  editMessage: (id, messageId, content) => api.patch(`/chats/${id}/messages/${messageId}`, { content }),
  deleteMessage: (id, messageId, scope = 'everyone') =>
    api.delete(`/chats/${id}/messages/${messageId}`, { params: { scope } }),
  reactToMessage: (id, messageId, emoji) =>
    api.post(`/chats/${id}/messages/${messageId}/reactions`, { emoji }),
  markAsRead: (id) => api.post(`/chats/${id}/read`),
  addParticipant: (id, userId) => api.post(`/chats/${id}/participants`, { userId }),
  leave: (id) => api.post(`/chats/${id}/leave`),
};

export default chatApi;
