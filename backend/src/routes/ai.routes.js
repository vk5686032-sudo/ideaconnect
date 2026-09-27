const express = require('express');
/**
 * @openapi
 * /ai/ideas/{id}/analyze:
 *   post:
 *     tags: [AI]
 *     summary: Analyse an idea (feasibility, innovation, market, suggestions, challenges)
 *     description: "Requires AI access. Without a configured OPENAI_API_KEY the service returns deterministic mock scores so the UI stays usable."
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Analysis stored on the idea as `aiAnalysis` }
 *       404: { description: Idea not found }
 */

/**
 * @openapi
 * /ai/ideas/{id}/similar:
 *   get:
 *     tags: [AI]
 *     summary: Find similar / duplicate ideas
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Similar ideas }
 */

/**
 * @openapi
 * /ai/ideas/{id}/teammates:
 *   get:
 *     tags: [AI]
 *     summary: Suggest users whose skills match an idea's required skills
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Suggested teammates }
 */

/**
 * @openapi
 * /ai/improve/title:
 *   post:
 *     tags: [AI]
 *     summary: Suggest improved title wording
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *     responses:
 *       200: { description: Suggested title(s) }
 */

/**
 * @openapi
 * /ai/improve/description:
 *   post:
 *     tags: [AI]
 *     summary: Suggest an improved description
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description]
 *             properties:
 *               description: { type: string }
 *     responses:
 *       200: { description: Suggested description(s) }
 */

/**
 * @openapi
 * /ai/check-duplicates:
 *   post:
 *     tags: [AI]
 *     summary: Check an idea for duplicates before creating it
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
 *     responses:
 *       200: { description: Potential duplicates }
 */

/**
 * @openapi
 * /ai/recommendations:
 *   get:
 *     tags: [AI]
 *     summary: Personalized idea recommendations
 *     responses:
 *       200: { description: Recommended ideas }
 */
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.post('/ideas/:id/analyze', aiController.analyzeIdea);
router.get('/ideas/:id/similar', aiController.getSimilarIdeas);
router.post('/improve/title', aiController.improveTitle);
router.post('/improve/description', aiController.improveDescription);
router.get('/ideas/:id/teammates', aiController.suggestTeammates);
router.post('/check-duplicates', aiController.checkDuplicates);
router.get('/recommendations', aiController.getRecommendations);

module.exports = router;
