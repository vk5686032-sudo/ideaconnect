const express = require('express');
// Every route in this file is admin-only (enforced by the authorize('admin')
// middleware below, applied to the whole router).

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Dashboard totals (users, ideas, projects, active users, pending mentor requests)
 *     responses:
 *       200: { description: Dashboard stats }
 *       403: { description: Admin only, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */

/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Ideas by category, projects by status, top users by reputation
 *     responses:
 *       200: { description: Analytics aggregates }
 */

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: All users with moderation state
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: role, schema: { type: string, enum: [user, mentor, admin] } }
 *     responses:
 *       200: { description: Paginated users }
 */

/**
 * @openapi
 * /admin/users/{id}/role:
 *   put:
 *     tags: [Admin]
 *     summary: Change a user's role
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, mentor, admin] }
 *     responses:
 *       200: { description: Role updated }
 */

/**
 * @openapi
 * /admin/users/{id}/approve-mentor:
 *   put:
 *     tags: [Admin]
 *     summary: Approve or revoke a mentor application
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Mentor approval updated }
 */

/**
 * @openapi
 * /admin/users/{id}/ban:
 *   put:
 *     tags: [Admin]
 *     summary: Ban or unban a user
 *     description: Banning wipes the user's refresh tokens server-side; their next refresh returns 403.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Ban state updated }
 */

/**
 * @openapi
 * /admin/users/bulk:
 *   post:
 *     tags: [Admin]
 *     summary: Bulk user action
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIds, action]
 *             properties:
 *               userIds: { type: array, items: { type: string } }
 *               action: { type: string, enum: [ban, unban, makeMentor, makeUser] }
 *     responses:
 *       200: { description: Bulk action result }
 */

/**
 * @openapi
 * /admin/ideas:
 *   get:
 *     tags: [Admin]
 *     summary: All ideas including drafts and archived
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated ideas }
 */

/**
 * @openapi
 * /admin/ideas/{id}/moderate:
 *   post:
 *     tags: [Admin]
 *     summary: Archive, restore or delete an idea
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [archive, restore, delete] }
 *               reason: { type: string }
 *     responses:
 *       200: { description: Moderated }
 */

/**
 * @openapi
 * /admin/ideas/bulk:
 *   post:
 *     tags: [Admin]
 *     summary: Bulk moderate ideas
 *     responses:
 *       200: { description: Bulk action result }
 */

/**
 * @openapi
 * /admin/projects:
 *   get:
 *     tags: [Admin]
 *     summary: All projects
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated projects }
 */

/**
 * @openapi
 * /admin/projects/{id}/moderate:
 *   post:
 *     tags: [Admin]
 *     summary: Archive, restore or delete a project
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [archive, restore, delete] }
 *               reason: { type: string }
 *     responses:
 *       200: { description: Moderated }
 */

/**
 * @openapi
 * /admin/projects/bulk:
 *   post:
 *     tags: [Admin]
 *     summary: Bulk moderate projects
 *     responses:
 *       200: { description: Bulk action result }
 */

/**
 * @openapi
 * /admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: User-submitted content reports
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [pending, resolved] } }
 *     responses:
 *       200: { description: Reports }
 */

/**
 * @openapi
 * /admin/reports/{id}/resolve:
 *   post:
 *     tags: [Admin]
 *     summary: Resolve or dismiss a report
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resolution]
 *             properties:
 *               resolution: { type: string, enum: [dismiss, archive, delete] }
 *               note: { type: string }
 *     responses:
 *       200: { description: Report resolved }
 */

/**
 * @openapi
 * /admin/pending-approvals:
 *   get:
 *     tags: [Admin]
 *     summary: Ideas and projects awaiting approval
 *     responses:
 *       200: { description: Pending approvals }
 */

/**
 * @openapi
 * /admin/ideas/{id}/review:
 *   post:
 *     tags: [Admin]
 *     summary: Approve or reject a pending idea
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [approve, reject] }
 *               note: { type: string }
 *     responses:
 *       200: { description: Reviewed }
 */

/**
 * @openapi
 * /admin/projects/{id}/review:
 *   post:
 *     tags: [Admin]
 *     summary: Approve or reject a pending project
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [approve, reject] }
 *               note: { type: string }
 *     responses:
 *       200: { description: Reviewed }
 */

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Audit trail of administrative actions
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: action, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated audit logs }
 */
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
