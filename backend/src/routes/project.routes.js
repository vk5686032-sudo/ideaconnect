const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { protect, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', projectController.getAllProjects);

// Protected routes - specific paths BEFORE :id routes
router.get('/my/projects', protect, projectController.getMyProjects);
router.post('/invitations/:invitationId/:action', protect, projectController.handleInvitation);

// Dynamic :id routes
router.get('/:id', projectController.getProjectById);
router.post('/', protect, projectController.createProject);
router.put('/:id', protect, projectController.updateProject);
router.delete('/:id', protect, projectController.deleteProject);
router.post('/:id/invite', protect, projectController.inviteMember);
router.post('/:id/members', protect, projectController.addMember);
router.delete('/:id/members/:userId', protect, projectController.removeMember);
router.put('/:id/members/:userId/role', protect, projectController.updateMemberRole);
router.post('/:id/join-request', protect, projectController.requestToJoin);
router.get('/:id/invitations', protect, projectController.getProjectInvitations);
router.put('/:id/progress', protect, projectController.updateProgress);

module.exports = router;
