// Central OpenAPI specification for the IdeaConnect API.
// Served at /api/v1/docs (Swagger UI) and /api/v1/docs.json (raw spec).
// Route-level annotations live in the controllers via @openapi comments.

const swaggerJsdoc = require('swagger-jsdoc');

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IdeaConnect API',
      version: '1.0.0',
      description:
        'REST + realtime API powering the IdeaConnect collaborative innovation platform. ' +
        'Consumed by the React web app and the React Native (Expo) mobile app. ' +
        'All authenticated endpoints expect a Bearer access token; renew it via /auth/refresh.',
      license: { name: 'Educational use' },
    },
    servers: [
      { url: '/api/v1', description: 'Current version' },
      { url: '/api', description: 'Legacy alias (deprecated)' },
    ],
    tags: [
      { name: 'Auth', description: 'Registration, login, token refresh, password reset' },
      { name: 'Users', description: 'Profiles, avatars, account management' },
      { name: 'Ideas', description: 'Idea CRUD, likes, bookmarks, comments, mentor reviews, teams' },
      { name: 'Projects', description: 'Projects, members, invitations, milestones' },
      { name: 'Tasks', description: 'Project tasks and milestones' },
      { name: 'Chats', description: 'Direct/group chats, messages, attachments' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Mentors', description: 'Mentor directory and mentorship requests' },
      { name: 'Reports', description: 'Content reporting' },
      { name: 'AI', description: 'AI-powered idea analysis and suggestions' },
      { name: 'Admin', description: 'Platform administration (admin only)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        AuthPayload: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/UserSummary' },
            token: { type: 'string', description: 'Short-lived JWT access token (~15m)' },
            refreshToken: { type: 'string', description: 'Opaque refresh token (~30d). Store securely; rotate on every use.' },
          },
        },
        UserSummary: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['user', 'mentor', 'admin'] },
            avatar: { type: 'object', properties: { url: { type: 'string' } } },
            isVerified: { type: 'boolean' },
            isMentorApproved: { type: 'boolean' },
            reputation: { type: 'number' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Annotated source files
  apis: [
    './src/routes/*.js',
  ],
});

module.exports = spec;
