const express = require('express');
/**
 * @openapi
 * /reports:
 *   post:
 *     tags: [Reports]
 *     summary: Report an idea, project, comment or user
 *     description: "Reports surface in the admin panel (GET /admin/reports) for one-click archive/delete resolution."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetType, targetId, reason]
 *             properties:
 *               targetType: { type: string, enum: [idea, project, comment, user] }
 *               targetId: { type: string }
 *               reason: { type: string, enum: [spam, harassment, inappropriate, misinformation, other] }
 *               details: { type: string }
 *     responses:
 *       201: { description: Report filed }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect } = require('../middlewares/auth');
const { createReportSchema, validate } = require('../validations/report.validation');

router.post('/', protect, validate(createReportSchema), reportController.createReport);

module.exports = router;
