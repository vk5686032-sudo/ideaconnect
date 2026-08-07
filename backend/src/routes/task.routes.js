const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { protect } = require('../middlewares/auth');

// Tasks
router.get('/tasks/my', protect, taskController.getMyTasks);
router.get('/projects/:projectId/tasks', protect, taskController.getProjectTasks);
router.post('/projects/:projectId/tasks', protect, taskController.createTask);
router.put('/tasks/:id', protect, taskController.updateTask);
router.delete('/tasks/:id', protect, taskController.deleteTask);

// Milestones (belong to a project)
router.post('/projects/:projectId/milestones', protect, taskController.addMilestone);
router.put('/projects/:projectId/milestones/:milestoneId', protect, taskController.updateMilestone);
router.delete('/projects/:projectId/milestones/:milestoneId', protect, taskController.deleteMilestone);

module.exports = router;