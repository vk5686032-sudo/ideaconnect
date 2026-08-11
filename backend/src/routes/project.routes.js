const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { protect, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);

// Protected routes
router.post('/', protect, projectController.createProject);
router.put('/:id', protect, projectController.updateProject);
router.delete('/:id', protect, projectController.deleteProject);
router.post('/:id/invite', protect, projectController.inviteMember);
router.post('/:id/members', protect, projectController.addMember);
router.delete('/:id/members/:userId', protect, projectController.removeMember);
router.put('/:id/members/:userId/role', protect, projectController.updateMemberRole);
router.post('/invitations/:invitationId/:action', protect, projectController.handleInvitation);
router.put('/:id/progress', protect, projectController.updateProgress);
router.get('/my/projects', protect, projectController.getMyProjects);

module.exports = router;
