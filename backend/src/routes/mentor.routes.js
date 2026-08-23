const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentor.controller');
const { protect, isApprovedMentor } = require('../middlewares/auth');

// Static paths first so they don't collide with /:id routes
router.get('/', mentorController.getMentors);

router.get('/requests/my', protect, mentorController.getMyMentorRequests);
router.get('/requests/incoming', protect, isApprovedMentor, mentorController.getIncomingMentorRequests);
router.post('/requests/:requestId/:action', protect, isApprovedMentor, mentorController.handleMentorRequest);

// Send a mentorship request to mentor :id
router.post('/:id/requests', protect, mentorController.sendMentorRequest);

module.exports = router;
