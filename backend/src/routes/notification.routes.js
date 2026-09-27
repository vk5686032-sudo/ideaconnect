const express = require('express');

/**
 * @openapi
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark every notification as read
 *     responses:
 *       200: { description: All marked read }
 */

/**
 * @openapi
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark one notification as read
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Marked read }
 */
/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: My notifications (paginated, newest first)
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: Notifications + unread handling via mark-read endpoints }
 */
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/', notificationController.getMyNotifications);

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Unread notification count (for badge display)
 *     responses:
 *       200: { description: "{ count: number }" }
 */
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;