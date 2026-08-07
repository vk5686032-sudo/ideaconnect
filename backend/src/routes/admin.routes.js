const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/approve-mentor', adminController.approveMentor);
router.put('/users/:id/ban', adminController.toggleBanUser);
router.get('/ideas', adminController.getAllIdeas);
router.post('/ideas/:id/moderate', adminController.moderateIdea);
router.get('/projects', adminController.getAllProjects);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
