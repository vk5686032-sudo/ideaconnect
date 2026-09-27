const express = require('express');

/**
 * @openapi
 * /ideas/comments/{id}/like:
 *   post:
 *     tags: [Ideas]
 *     summary: Toggle a like on a comment
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated like state }
 */

/**
 * @openapi
 * /ideas/comments/{id}:
 *   put:
 *     tags: [Ideas]
 *     summary: Edit my comment
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200: { description: Comment updated }
 *   delete:
 *     tags: [Ideas]
 *     summary: Delete a comment (own, or admin)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Comment deleted }
 */

/**
 * @openapi
 * /ideas/{ideaId}/comments:
 *   get:
 *     tags: [Ideas]
 *     summary: Comments on an idea, with reply threads
 *     security: []
 *     parameters:
 *       - { in: path, name: ideaId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Comments }
 *   post:
 *     tags: [Ideas]
 *     summary: Add a comment or a reply
 *     description: "Text supports @Full Name mentions, which send mention notifications."
 *     parameters:
 *       - { in: path, name: ideaId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *               parentId: { type: string, description: "Set to reply to an existing comment" }
 *     responses:
 *       201: { description: Comment created; author earns +3, parent author +1 }
 */

/**
 * @openapi
 * /ideas/{id}/team/{userId}:
 *   delete:
 *     tags: [Ideas]
 *     summary: Remove a member from the idea team (author only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Member removed }
 */

/**
 * @openapi
 * /ideas/{id}/invites:
 *   post:
 *     tags: [Ideas]
 *     summary: Invite a user to the idea team (author only)
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
 *               role: { type: string }
 *               message: { type: string }
 *     responses:
 *       201: { description: Invitation sent }
 */

/**
 * @openapi
 * /ideas/invites/my:
 *   get:
 *     tags: [Ideas]
 *     summary: Idea invitations addressed to me
 *     responses:
 *       200: { description: Incoming idea invites }
 */

/**
 * @openapi
 * /ideas/invites/{invitationId}/{action}:
 *   post:
 *     tags: [Ideas]
 *     summary: Accept or reject an idea team invitation
 *     parameters:
 *       - { in: path, name: invitationId, required: true, schema: { type: string } }
 *       - { in: path, name: action, required: true, schema: { type: string, enum: [accept, reject] } }
 *     responses:
 *       200: { description: Invitation handled }
 */

/**
 * @openapi
 * /ideas/start-project-requests/{requestId}/{action}:
 *   post:
 *     tags: [Ideas]
 *     summary: Approve or reject a start-project request
 *     parameters:
 *       - { in: path, name: requestId, required: true, schema: { type: string } }
 *       - { in: path, name: action, required: true, schema: { type: string, enum: [approve, reject] } }
 *     responses:
 *       200: { description: Request handled }
 */

/**
 * @openapi
 * /ideas/{id}/my-start-project-request:
 *   get:
 *     tags: [Ideas]
 *     summary: My start-project request status for an idea
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Request or null }
 */

/**
 * @openapi
 * /ideas/{id}/start-project-requests:
 *   get:
 *     tags: [Ideas]
 *     summary: Start-project requests for my idea (author only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Requests }
 */

/**
 * @openapi
 * /ideas/{id}/start-project-request:
 *   post:
 *     tags: [Ideas]
 *     summary: Ask the idea owner to start a project from this idea
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
 *       201: { description: Request sent }
 */

/**
 * @openapi
 * /ideas/my/bookmarks:
 *   get:
 *     tags: [Ideas]
 *     summary: Ideas I have bookmarked
 *     responses:
 *       200: { description: Bookmarked ideas }
 */

/**
 * @openapi
 * /ideas/my/ideas:
 *   get:
 *     tags: [Ideas]
 *     summary: Ideas I created (including drafts)
 *     responses:
 *       200: { description: My ideas }
 */

/**
 * @openapi
 * /ideas/{id}/review:
 *   post:
 *     tags: [Ideas]
 *     summary: Add or update my mentor review (upsert)
 *     description: Approved mentors only. Grants the mentor +5 reputation.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [review, rating]
 *             properties:
 *               review: { type: string, minLength: 10 }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       200: { description: Review saved }
 *       403: { description: Not an approved mentor }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *   delete:
 *     tags: [Ideas]
 *     summary: Delete my mentor review
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Review removed }
 */

/**
 * @openapi
 * /ideas/{id}/bookmark:
 *   post:
 *     tags: [Ideas]
 *     summary: Toggle a bookmark
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: "{ isBookmarked }" }
 */

/**
 * @openapi
 * /ideas/{id}/like:
 *   post:
 *     tags: [Ideas]
 *     summary: Toggle a like (idempotent per user)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: "{ likesCount, isLiked }" }
 */
const router = express.Router();
const ideaController = require('../controllers/idea.controller');
const commentController = require('../controllers/comment.controller');
const { protect, checkVerification, isApprovedMentor, optionalAuth } = require('../middlewares/auth');
const { createIdeaSchema, mentorReviewSchema, validate } = require('../validations/idea.validation');
const { uploadMultiple } = require('../middlewares/upload');

// Public routes
/**
 * @openapi
 * /ideas:
 *   get:
 *     tags: [Ideas]
 *     summary: Browse public ideas
 *     security: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: category, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [open, in-progress, completed, archived] } }
 *       - { in: query, name: sort, schema: { type: string, enum: [newest, oldest, popular, trending] } }
 *     responses:
 *       200: { description: Paginated public ideas (drafts excluded) }
 *   post:
 *     tags: [Ideas]
 *     summary: Create an idea
 *     description: "Writes require a verified email. Set status to draft to keep it out of the public feed."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, category]
 *             properties:
 *               title: { type: string, minLength: 5 }
 *               description: { type: string, minLength: 20 }
 *               category: { type: string }
 *               tags: { type: array, items: { type: string } }
 *               requiredSkills: { type: array, items: { type: string } }
 *               visibility: { type: string, enum: [public, private, invite-only] }
 *               status: { type: string, enum: [open, draft] }
 *     responses:
 *       201: { description: Created idea }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get('/', ideaController.getAllIdeas);

/**
 * @openapi
 * /ideas/{id}:
 *   get:
 *     tags: [Ideas]
 *     summary: Idea detail (private/invite-only visible to author, team, admin)
 *     security: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Full idea with author, team, reviews, AI analysis }
 *       404: { description: Not found or no visibility access }
 *   put:
 *     tags: [Ideas]
 *     summary: Update my idea
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated idea }
 *       403: { description: Not the author }
 *   delete:
 *     tags: [Ideas]
 *     summary: Delete my idea
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:id', optionalAuth, ideaController.getIdeaById);

// Protected routes (writes require a verified email)
router.post('/', protect, checkVerification, validate(createIdeaSchema), ideaController.createIdea);
router.put('/:id', protect, checkVerification, ideaController.updateIdea);
router.delete('/:id', protect, ideaController.deleteIdea);
router.post('/:id/like', protect, ideaController.toggleLike);
router.post('/:id/bookmark', protect, ideaController.toggleBookmark);

// Mentor reviews
router.post('/:id/review', protect, checkVerification, isApprovedMentor, validate(mentorReviewSchema), ideaController.addMentorReview);
router.delete('/:id/review', protect, ideaController.deleteMentorReview);
router.get('/my/ideas', protect, ideaController.getMyIdeas);
router.get('/my/bookmarks', protect, ideaController.getBookmarkedIdeas);

// Start-project requests
router.post('/:id/start-project-request', protect, ideaController.requestStartProject);
router.get('/:id/start-project-requests', protect, ideaController.getStartProjectRequests);
router.get('/:id/my-start-project-request', protect, ideaController.getMyStartProjectRequest);
router.post('/start-project-requests/:requestId/:action', protect, ideaController.handleStartProjectRequest);

// Idea team invitations (static path before /:id routes)
router.post('/invites/:invitationId/:action', protect, ideaController.handleIdeaInvite);
router.get('/invites/my', protect, ideaController.getMyIdeaInvites);

// Team management
router.post('/:id/invites', protect, checkVerification, ideaController.inviteToIdea);
router.delete('/:id/team/:userId', protect, ideaController.removeTeamMember);

// Comments
router.post('/:ideaId/comments', protect, checkVerification, commentController.createComment);
router.get('/:ideaId/comments', commentController.getComments);
router.put('/comments/:id', protect, commentController.updateComment);
router.delete('/comments/:id', protect, commentController.deleteComment);
router.post('/comments/:id/like', protect, commentController.toggleLike);

module.exports = router;
