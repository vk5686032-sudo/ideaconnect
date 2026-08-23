import api from './axios';

export const mentorApi = {
  getMentors: (params) => api.get('/mentors', { params }),
  sendRequest: (mentorId, data) => api.post(`/mentors/${mentorId}/requests`, data),
  getMyRequests: () => api.get('/mentors/requests/my'),
  getIncomingRequests: () => api.get('/mentors/requests/incoming'),
  handleRequest: (requestId, action) => api.post(`/mentors/requests/${requestId}/${action}`),
};

export default mentorApi;
