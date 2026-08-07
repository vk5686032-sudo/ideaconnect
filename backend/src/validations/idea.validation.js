const { z } = require('zod');
const { validate } = require('./auth.validation');

const createIdeaSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
    category: z.enum(['technology', 'business', 'healthcare', 'education', 'environment', 'social', 'entertainment', 'finance', 'other']),
    tags: z.array(z.string()).optional(),
    requiredSkills: z.array(z.string()).optional(),
    visibility: z.enum(['public', 'private', 'invite-only']).default('public'),
    status: z.enum(['draft', 'open', 'in-progress', 'completed', 'archived']).default('open'),
  }),
});

const updateIdeaSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(200).optional(),
    description: z.string().min(20).max(5000).optional(),
    category: z.enum(['technology', 'business', 'healthcare', 'education', 'environment', 'social', 'entertainment', 'finance', 'other']).optional(),
    tags: z.array(z.string()).optional(),
    requiredSkills: z.array(z.string()).optional(),
    visibility: z.enum(['public', 'private', 'invite-only']).optional(),
    status: z.enum(['draft', 'open', 'in-progress', 'completed', 'archived']).optional(),
  }),
});

const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(2000),
  }),
});

module.exports = {
  createIdeaSchema,
  updateIdeaSchema,
  createCommentSchema,
  validate,
};
