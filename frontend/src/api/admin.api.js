import api from './axios';

const adminApi = {
  // Dashboard & analytics
  getStats: () => api.get('/admin/stats'),
  getAnalytics: () => api.get('/admin/analytics'),

  // User management
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  approveMentor: (id) => api.put(`/admin/users/${id}/approve-mentor`),
  toggleBan: (id) => api.put(`/admin/users/${id}/ban`),
  bulkUserAction: (ids, action) => api.post('/admin/users/bulk', { ids, action }),

  // Idea management
  getIdeas: (params) => api.get('/admin/ideas', { params }),
  moderateIdea: (id, action, reason) => api.post(`/admin/ideas/${id}/moderate`, { action, reason }),
  bulkIdeaAction: (ids, action) => api.post('/admin/ideas/bulk', { ids, action }),

  // Project management
  getProjects: (params) => api.get('/admin/projects', { params }),
  moderateProject: (id, action, reason) => api.post(`/admin/projects/${id}/moderate`, { action, reason }),
  bulkProjectAction: (ids, action) => api.post('/admin/projects/bulk', { ids, action }),

  // Content reports
  getReports: (params) => api.get('/admin/reports', { params }),
  resolveReport: (id, action, note) => api.post(`/admin/reports/${id}/resolve`, { action, note }),

  // Content approval
  getPendingApprovals: (params) => api.get('/admin/pending-approvals', { params }),
  reviewIdeaApproval: (id, approve, reason) => api.post(`/admin/ideas/${id}/review`, { approve, reason }),
  reviewProjectApproval: (id, approve, reason) => api.post(`/admin/projects/${id}/review`, { approve, reason }),

  // Audit logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export default adminApi;