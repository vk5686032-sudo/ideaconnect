const express = require('express');
/**
 * @openapi
 * /mentors:
 *   get:
 *     tags: [Mentors]
 *     summary: Approved mentor directory, reputation-sorted
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *     responses:
 *       200: { description: Approved mentors (name, avatar, bio, skills, reputation) }
 */

/**
 * @openapi
 * /mentors/requests/my:
 *   get:
 *     tags: [Mentors]
 *     summary: Mentorship requests I sent
 *     responses:
 *       200: { description: Sent requests with status }
 */

/**
 * @openapi
 * /mentors/requests/incoming:
 *   get:
 *     tags: [Mentors]
 *     summary: Mentorship requests awaiting my response (approved mentors only)
 *     responses:
 *       200: { description: Incoming requests with mentee populated }
 *       401: { description: Not an approved mentor }
 */

/**
 * @openapi
 * /mentors/requests/{requestId}/{action}:
 *   post:
 *     tags: [Mentors]
 *     summary: Accept or reject an incoming mentorship request
 *     description: "action is accept or reject. Accepting creates (or reuses) a direct chat between mentor and mentee."
 *     parameters:
 *       - { in: path, name: requestId, required: true, schema: { type: string } }
 *       - { in: path, name: action, required: true, schema: { type: string, enum: [accept, reject] } }
 *     responses:
 *       200: { description: Request handled }
 *       400: { description: Already handled }
 */

/**
 * @openapi
 * /mentors/{id}/requests:
 *   post:
 *     tags: [Mentors]
 *     summary: Request mentorship from a mentor
 *     description: A second pending request to the same mentor is rejected with 400.
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
 *       400: { description: Duplicate pending request, or requesting yourself }
 */
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
