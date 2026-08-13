import api from './axios';

export const ideaApi = {
  getAll: (params) => api.get('/ideas', { params }),
  getById: (id) => api.get(`/ideas/${id}`),
  create: (data) => api.post('/ideas', data),
  update: (id, data) => api.put(`/ideas/${id}`, data),
  delete: (id) => api.delete(`/ideas/${id}`),
  toggleLike: (id) => api.post(`/ideas/${id}/like`),
  toggleBookmark: (id) => api.post(`/ideas/${id}/bookmark`),
  getMy: () => api.get('/ideas/my/ideas'),
  getBookmarks: () => api.get('/ideas/my/bookmarks'),
  addComment: (ideaId, data) => api.post(`/ideas/${ideaId}/comments`, data),
  getComments: (ideaId) => api.get(`/ideas/${ideaId}/comments`),
  updateComment: (id, data) => api.put(`/ideas/comments/${id}`, data),
  deleteComment: (id) => api.delete(`/ideas/comments/${id}`),
  likeComment: (id) => api.post(`/ideas/comments/${id}/like`),
  // Start-project request methods
  requestStartProject: (ideaId, data) => api.post(`/ideas/${ideaId}/start-project-request`, data),
  getStartProjectRequests: (ideaId) => api.get(`/ideas/${ideaId}/start-project-requests`),
  getMyStartProjectRequest: (ideaId) => api.get(`/ideas/${ideaId}/my-start-project-request`),
  handleStartProjectRequest: (requestId, action) => api.post(`/ideas/start-project-requests/${requestId}/${action}`),
};

export default ideaApi;
