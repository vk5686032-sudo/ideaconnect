const express = require('express');
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
