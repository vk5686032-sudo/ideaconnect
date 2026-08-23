const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { protect, checkVerification } = require('../middlewares/auth');

// Tasks
router.get('/tasks/my', protect, taskController.getMyTasks);
router.get('/projects/:projectId/tasks', protect, taskController.getProjectTasks);
router.post('/projects/:projectId/tasks', protect, checkVerification, taskController.createTask);
router.put('/tasks/reorder', protect, taskController.reorderTasks); // before /:id
router.put('/tasks/:id', protect, checkVerification, taskController.updateTask);
router.delete('/tasks/:id', protect, taskController.deleteTask);

// Milestones (belong to a project)
router.post('/projects/:projectId/milestones', protect, checkVerification, taskController.addMilestone);
router.put('/projects/:projectId/milestones/:milestoneId', protect, checkVerification, taskController.updateMilestone);
router.delete('/projects/:projectId/milestones/:milestoneId', protect, taskController.deleteMilestone);

module.exports = router;