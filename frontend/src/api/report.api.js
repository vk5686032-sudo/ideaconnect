import api from './axios';

const reportApi = {
  create: (data) => api.post('/reports', data),
};

export default reportApi;
