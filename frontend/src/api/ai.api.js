import api from './axios';

const aiApi = {
  analyzeIdea: (id) => api.post(`/ai/ideas/${id}/analyze`),
  getSimilarIdeas: (id) => api.get(`/ai/ideas/${id}/similar`),
  improveTitle: (data) => api.post('/ai/improve/title', data),
  improveDescription: (data) => api.post('/ai/improve/description', data),
  suggestTeammates: (id) => api.get(`/ai/ideas/${id}/teammates`),
  checkDuplicates: (data) => api.post('/ai/check-duplicates', data),
  getRecommendations: () => api.get('/ai/recommendations'),
};

export default aiApi;
