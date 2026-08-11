import api from './axios';

export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
};

export default userApi;
