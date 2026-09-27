const express = require('express');
/**
 * @openapi
 * /chats:
 *   get:
 *     tags: [Chats]
 *     summary: My chats (direct + group/project)
 *     description: Each row carries the last message for list previews.
 *     responses:
 *       200: { description: My chats }
 */

/**
 * @openapi
 * /chats/direct:
 *   post:
 *     tags: [Chats]
 *     summary: Create or fetch the direct chat with a user
 *     description: Idempotent - returns the existing direct chat rather than creating a duplicate.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId]
 *             properties:
 *               recipientId: { type: string }
 *     responses:
 *       200: { description: Direct chat (existing or new) }
 *       400: { description: Cannot DM yourself }
 */

/**
 * @openapi
 * /chats/group:
 *   post:
 *     tags: [Chats]
 *     summary: Create a group chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               members: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Created group chat }
 */

/**
 * @openapi
 * /chats/project/{projectId}:
 *   get:
 *     tags: [Chats]
 *     summary: Get or create the team chat for a project
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Project chat }
 *       403: { description: Not a project member }
 */

/**
 * @openapi
 * /chats/{id}:
 *   get:
 *     tags: [Chats]
 *     summary: Chat detail with participants
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Chat }
 *       404: { description: Not found or not a participant }
 */

/**
 * @openapi
 * /chats/{id}/messages:
 *   get:
 *     tags: [Chats]
 *     summary: Paginated message history
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer, default: 30 } }
 *     responses:
 *       200: { description: Paginated messages }
 */

/**
 * @openapi
 * /chats/{id}/messages/{messageId}:
 *   patch:
 *     tags: [Chats]
 *     summary: Edit my message
 *     description: Broadcasts `message:edited` over Socket.io to the room.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: messageId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200: { description: Edited message }
 *   delete:
 *     tags: [Chats]
 *     summary: Delete a message
 *     description: "scope is me (delete for me) or everyone (own messages only). Broadcasts message:deleted / message:deletedFor."
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: messageId, required: true, schema: { type: string } }
 *       - { in: query, name: scope, schema: { type: string, enum: [me, everyone], default: everyone } }
 *     responses:
 *       200: { description: Deleted }
 */

/**
 * @openapi
 * /chats/{id}/messages/{messageId}/reactions:
 *   post:
 *     tags: [Chats]
 *     summary: Toggle an emoji reaction on a message
 *     description: Broadcasts `message:reacted` with the updated reaction set.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: messageId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emoji]
 *             properties:
 *               emoji: { type: string, example: "👍" }
 *     responses:
 *       200: { description: Updated reactions }
 */

/**
 * @openapi
 * /chats/{id}/attachments:
 *   post:
 *     tags: [Chats]
 *     summary: Send a message with a file attachment
 *     description: Broadcasts `message:received` to the room on success.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary, description: "Image or document, max 10MB" }
 *               content: { type: string, description: "Optional text alongside the file" }
 *     responses:
 *       201: { description: Message with attachment }
 */

/**
 * @openapi
 * /chats/{id}/participants:
 *   post:
 *     tags: [Chats]
 *     summary: Add a participant to a group chat
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Participant added }
 */

/**
 * @openapi
 * /chats/{id}/participants/{userId}:
 *   delete:
 *     tags: [Chats]
 *     summary: Remove a participant
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Participant removed }
 */

/**
 * @openapi
 * /chats/{id}/participants/{userId}/promote:
 *   post:
 *     tags: [Chats]
 *     summary: Promote a participant to group admin
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Participant promoted }
 */

/**
 * @openapi
 * /chats/{id}/leave:
 *   post:
 *     tags: [Chats]
 *     summary: Leave a group chat
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Left the chat }
 */
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth');
const { uploadChatFile } = require('../middlewares/upload');

router.use(protect);

router.post('/direct', chatController.createOrGetDirectChat);
router.post('/group', chatController.createGroupChat);
router.get('/', chatController.getMyChats);
router.get('/project/:projectId', chatController.getOrCreateProjectChat);
router.get('/:id', chatController.getChatById);
router.get('/:id/messages', chatController.getMessages);
router.patch('/:id/messages/:messageId', chatController.editMessage);
router.delete('/:id/messages/:messageId', chatController.deleteMessage);
router.post('/:id/messages/:messageId/reactions', chatController.reactToMessage);
router.post('/:id/attachments', uploadChatFile.single('file'), chatController.sendAttachment);
router.post('/:id/participants', chatController.addParticipant);
router.delete('/:id/participants/:userId', chatController.removeParticipant);
router.post('/:id/participants/:userId/promote', chatController.promoteToAdmin);
router.post('/:id/leave', chatController.leaveChat);

module.exports = router;
