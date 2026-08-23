import api from './axios';

export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateAvatar: (formData) =>
    api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/users/change-password', data),
  deleteAccount: (data) => api.delete('/users/account', { data }),
  getStats: () => api.get('/users/me/stats'),
};

export default userApi;
