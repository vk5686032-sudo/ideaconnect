const express = require('express');

/**
 * @openapi
 * /projects/{id}/members/{userId}/role:
 *   put:
 *     tags: [Projects]
 *     summary: Change a member's role (owner only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [lead, developer, designer, researcher, mentor] }
 *     responses:
 *       200: { description: Role updated }
 */

/**
 * @openapi
 * /projects/{id}/members/{userId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Remove a project member (owner only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Member removed }
 */

/**
 * @openapi
 * /projects/{id}/invite:
 *   post:
 *     tags: [Projects]
 *     summary: Invite a user to a project (owner only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *               role: { type: string, enum: [lead, developer, designer, researcher, mentor] }
 *               message: { type: string }
 *     responses:
 *       201: { description: Invitation sent }
 */
/**
 * @openapi
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: Browse public projects (paginated)
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated public projects }
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     description: The creator is added as owner and a `lead` member automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string, minLength: 3 }
 *               description: { type: string, minLength: 10 }
 *               technologies: { type: array, items: { type: string } }
 *               deadline: { type: string, format: date }
 *               visibility: { type: string, enum: [public, private] }
 *               ideaId: { type: string, description: "Convert an existing idea into a project" }
 *     responses:
 *       201: { description: Created project }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */

/**
 * @openapi
 * /projects/my/projects:
 *   get:
 *     tags: [Projects]
 *     summary: Projects I own or am a member of
 *     responses:
 *       200: { description: My projects }
 */

/**
 * @openapi
 * /projects/invitations/{invitationId}/{action}:
 *   post:
 *     tags: [Projects]
 *     summary: Accept or reject a project invitation / join request
 *     description: "action is accept or reject. Accepting adds the requester (or invitee) as a member; already-members are never duplicated."
 *     parameters:
 *       - { in: path, name: invitationId, required: true, schema: { type: string } }
 *       - { in: path, name: action, required: true, schema: { type: string, enum: [accept, reject] } }
 *     responses:
 *       200: { description: Invitation handled }
 *       400: { description: "Invitation already handled, or requester is already a member", content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Invitation not found }
 */

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Project detail
 *     description: Returns owner, populated members, tasks, milestones and progress. Private projects 404 for non-members.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Project }
 *       404: { description: Not found or not visible }
 *   put:
 *     tags: [Projects]
 *     summary: Update a project (owner only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated project }
 *       403: { description: Not the owner }
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project (owner only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */

/**
 * @openapi
 * /projects/{id}/members:
 *   post:
 *     tags: [Projects]
 *     summary: Add a member directly (owner only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, role]
 *             properties:
 *               userId: { type: string }
 *               role: { type: string, enum: [lead, developer, designer, researcher, mentor] }
 *     responses:
 *       200: { description: Member added }
 */

/**
 * @openapi
 * /projects/{id}/join-request:
 *   post:
 *     tags: [Projects]
 *     summary: Request to join a project
 *     description: Creates a pending invitation the owner can accept or reject. Duplicate pending requests are rejected.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string }
 *     responses:
 *       201: { description: Join request sent }
 *       400: { description: Already a member or already requested }
 */

/**
 * @openapi
 * /projects/{id}/invitations:
 *   get:
 *     tags: [Projects]
 *     summary: List invitations for a project (owner only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [pending, accepted, rejected, expired] } }
 *     responses:
 *       200: { description: Invitations }
 */

/**
 * @openapi
 * /projects/{id}/progress:
 *   put:
 *     tags: [Projects]
 *     summary: Set project progress manually
 *     description: Usually recalculated server-side from completed tasks.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [progress]
 *             properties:
 *               progress: { type: integer, minimum: 0, maximum: 100 }
 *     responses:
 *       200: { description: Updated progress }
 */
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { protect, authorize, checkVerification, optionalAuth } = require('../middlewares/auth');

// Public routes
router.get('/', projectController.getAllProjects);

// Protected routes - specific paths BEFORE :id routes
router.get('/my/projects', protect, projectController.getMyProjects);
router.post('/invitations/:invitationId/:action', protect, projectController.handleInvitation);

// Dynamic :id routes
router.get('/:id', optionalAuth, projectController.getProjectById);
router.post('/', protect, checkVerification, projectController.createProject);
router.put('/:id', protect, checkVerification, projectController.updateProject);
router.delete('/:id', protect, projectController.deleteProject);
router.post('/:id/invite', protect, checkVerification, projectController.inviteMember);
router.post('/:id/members', protect, checkVerification, projectController.addMember);
router.delete('/:id/members/:userId', protect, projectController.removeMember);
router.put('/:id/members/:userId/role', protect, projectController.updateMemberRole);
router.post('/:id/join-request', protect, projectController.requestToJoin);
router.get('/:id/invitations', protect, projectController.getProjectInvitations);
router.put('/:id/progress', protect, projectController.updateProgress);

module.exports = router;