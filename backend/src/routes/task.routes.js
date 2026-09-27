const express = require('express');
/**
 * @openapi
 * /tasks/my:
 *   get:
 *     tags: [Tasks]
 *     summary: Tasks assigned to me
 *     responses:
 *       200: { description: My open tasks }
 */

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: All tasks in a project
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Project tasks }
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task
 *     description: Creating with a status other than `todo is honoured. Project progress is recalculated server-side on completion.
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in-progress, review, completed, cancelled] }
 *               priority: { type: string, enum: [low, medium, high, urgent] }
 *               assignedTo: { type: string }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       201: { description: Created task }
 */

/**
 * @openapi
 * /tasks/reorder:
 *   put:
 *     tags: [Tasks]
 *     summary: Reorder tasks (drag-and-drop persistence)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tasks]
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     status: { type: string }
 *                     order: { type: integer }
 *     responses:
 *       200: { description: Reordered }
 */

/**
 * @openapi
 * /tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task
 *     description: Status transitions recalculate project progress and adjust assignee reputation (+/-10 on completion).
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in-progress, review, completed, cancelled] }
 *               priority: { type: string, enum: [low, medium, high, urgent] }
 *               assignedTo: { type: string }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       200: { description: Updated task }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */

/**
 * @openapi
 * /projects/{projectId}/milestones:
 *   post:
 *     tags: [Tasks]
 *     summary: Add a milestone
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               dueDate: { type: string, format: date }
 *               completed: { type: boolean }
 *     responses:
 *       201: { description: Created milestone }
 */

/**
 * @openapi
 * /projects/{projectId}/milestones/{milestoneId}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update or toggle completion of a milestone
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string } }
 *       - { in: path, name: milestoneId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated milestone }
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a milestone
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string } }
 *       - { in: path, name: milestoneId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
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