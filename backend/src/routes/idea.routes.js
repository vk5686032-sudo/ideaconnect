const express = require('express');
const router = express.Router();
const ideaController = require('../controllers/idea.controller');
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middlewares/auth');
const { createIdeaSchema, validate } = require('../validations/idea.validation');
const { uploadMultiple } = require('../middlewares/upload');

// Public routes
router.get('/', ideaController.getAllIdeas);
router.get('/:id', ideaController.getIdeaById);

// Protected routes
router.post('/', protect, validate(createIdeaSchema), ideaController.createIdea);
router.put('/:id', protect, ideaController.updateIdea);
router.delete('/:id', protect, ideaController.deleteIdea);
router.post('/:id/like', protect, ideaController.toggleLike);
router.post('/:id/bookmark', protect, ideaController.toggleBookmark);
router.get('/my/ideas', protect, ideaController.getMyIdeas);
router.get('/my/bookmarks', protect, ideaController.getBookmarkedIdeas);

// Start-project requests
router.post('/:id/start-project-request', protect, ideaController.requestStartProject);
router.get('/:id/start-project-requests', protect, ideaController.getStartProjectRequests);
router.get('/:id/my-start-project-request', protect, ideaController.getMyStartProjectRequest);
router.post('/start-project-requests/:requestId/:action', protect, ideaController.handleStartProjectRequest);

// Comments
router.post('/:ideaId/comments', protect, commentController.createComment);
router.get('/:ideaId/comments', commentController.getComments);
router.put('/comments/:id', protect, commentController.updateComment);
router.delete('/comments/:id', protect, commentController.deleteComment);
router.post('/comments/:id/like', protect, commentController.toggleLike);

module.exports = router;
