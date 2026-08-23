const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('admin'));

// Dashboard & analytics
router.get('/stats', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/approve-mentor', adminController.approveMentor);
router.put('/users/:id/ban', adminController.toggleBanUser);
router.post('/users/bulk', adminController.bulkUserAction);

// Idea management
router.get('/ideas', adminController.getAllIdeas);
router.post('/ideas/:id/moderate', adminController.moderateIdea);
router.post('/ideas/bulk', adminController.bulkIdeaAction);

// Project management
router.get('/projects', adminController.getAllProjects);
router.post('/projects/:id/moderate', adminController.moderateProject);
router.post('/projects/bulk', adminController.bulkProjectAction);

// Content reports
router.get('/reports', adminController.getReports);
router.post('/reports/:id/resolve', adminController.resolveReport);

// Content approval workflow
router.get('/pending-approvals', adminController.getPendingApprovals);
router.post('/ideas/:id/review', adminController.reviewIdeaApproval);
router.post('/projects/:id/review', adminController.reviewProjectApproval);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
