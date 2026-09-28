const express = require('express');
/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: User directory
 *     description: Paginated user list. Emails are withheld from other users (privacy allow-list).
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: skill, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated users }
 */

/**
 * @openapi
 * /users/search/skills:
 *   get:
 *     tags: [Users]
 *     summary: Search users by comma-separated skill list
 *     parameters:
 *       - { in: query, name: skills, required: true, schema: { type: string }, example: "javascript,react" }
 *     responses:
 *       200: { description: Matching users }
 */

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Public profile by id
 *     description: "The email field is present only for the profile owner or an admin."
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: User profile }
 *       404: { description: Not found }
 */

/**
 * @openapi
 * /users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update my profile
 *     description: Array fields (skills, interests, education, experience) are replaced wholesale.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               bio: { type: string }
 *               skills: { type: array, items: { type: string } }
 *               interests: { type: array, items: { type: string } }
 *               education: { type: array, items: { type: object } }
 *               experience: { type: array, items: { type: object } }
 *               socialLinks: { type: object }
 *     responses:
 *       200: { description: Updated user }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */

/**
 * @openapi
 * /users/avatar:
 *   put:
 *     tags: [Users]
 *     summary: Upload my avatar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: string, format: binary, description: "Image file, max 5MB" }
 *     responses:
 *       200: { description: "{ avatar: { url } }" }
 */

/**
 * @openapi
 * /users/change-password:
 *   put:
 *     tags: [Users]
 *     summary: Change my password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password changed }
 *       400: { description: Current password incorrect }
 */

/**
 * @openapi
 * /users/account:
 *   delete:
 *     tags: [Users]
 *     summary: Delete my account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200: { description: Account deleted }
 */

/**
 * @openapi
 * /users/me/stats:
 *   get:
 *     tags: [Users]
 *     summary: My dashboard stats
 *     responses:
 *       200: { description: "{ ideasCount, projectsCount, reputation }" }
 */

/**
 * @openapi
 * /users/me/push-tokens:
 *   put:
 *     tags: [Users]
 *     summary: Register an Expo push token for this device
 *     description: Called by the mobile app after permission is granted. Unregisters cleanly on logout.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, platform]
 *             properties:
 *               token: { type: string, example: "ExponentPushToken[xxx]" }
 *               platform: { type: string, enum: [ios, android, web] }
 *     responses:
 *       200: { description: Token registered }
 */

/**
 * @openapi
 * /users/me/push-tokens/{token}:
 *   delete:
 *     tags: [Users]
 *     summary: Unregister a device push token
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Token removed }
 */
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, optionalAuth } = require('../middlewares/auth');
const { updateProfileSchema, validate } = require('../validations/auth.validation');
const { uploadImage } = require('../middlewares/upload');

// Public routes
router.get('/', userController.getAllUsers);
router.get('/:id', optionalAuth, userController.getUserById);
router.get('/search/skills', userController.searchBySkills);

// Protected routes
router.put('/profile', protect, validate(updateProfileSchema), userController.updateProfile);
router.put('/avatar', protect, uploadImage.single('avatar'), userController.updateAvatar);
router.put('/change-password', protect, userController.changePassword);
router.delete('/account', protect, userController.deleteAccount);
router.get('/me/stats', protect, userController.getUserStats);

// Push notifications (Expo mobile app)
router.put('/me/push-tokens', protect, userController.registerPushToken);
router.delete('/me/push-tokens/:token', protect, userController.unregisterPushToken);

module.exports = router;