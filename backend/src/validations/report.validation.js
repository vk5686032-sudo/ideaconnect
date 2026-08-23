const { z } = require('zod');
const { validate } = require('./auth.validation');

const REPORT_REASONS = ['spam', 'harassment', 'inappropriate', 'misinformation', 'other'];
const REPORT_TARGETS = ['idea', 'project', 'comment', 'user'];

const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(REPORT_TARGETS, {
      errorMap: () => ({ message: 'targetType must be one of: idea, project, comment, user' }),
    }),
    targetId: z.string().min(1, 'targetId is required'),
    reason: z.enum(REPORT_REASONS, {
      errorMap: () => ({ message: `reason must be one of: ${REPORT_REASONS.join(', ')}` }),
    }),
    details: z.string().max(1000).optional(),
  }),
});

module.exports = {
  createReportSchema,
  REPORT_REASONS,
  REPORT_TARGETS,
  validate,
};
