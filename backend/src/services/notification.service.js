const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const { sendPushToUser } = require('./push.service');

/**
 * Create a notification, plus its realtime and push delivery.
 *
 * Deliberately never throws: all 21 call sites are bare `await`s inside
 * controller try-blocks whose catch turns a throw into a 5xx, so a failed
 * notification would fail the comment, like or project update that triggered
 * it. A failure is logged with the recipient and type instead, and null is
 * returned so a caller that cares can check.
 */
const create = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    await notification.populate('sender', 'name avatar');

    // Realtime push to the recipient if they're connected via Socket.io
    try {
      const io = getIO();
      io.to(`user:${notification.recipient}`).emit('notification', {
        type: notification.type,
        notification: notification.toObject ? notification.toObject() : notification,
      });
    } catch (socketError) {
      // Socket.io not initialized (e.g. during seeding) — the DB record is the
      // source of truth, so a missed realtime emit is not a failure.
      console.warn(
        `[notification] realtime emit skipped (recipient=${notification.recipient}):`,
        socketError.message
      );
    }

    // Expo push for mobile devices (fire-and-forget, best effort)
    const senderName = notification.sender?.name || 'Someone';
    sendPushToUser(notification.recipient, {
      title: notification.title || 'IdeaConnect',
      body: `${senderName}: ${notification.message || ''}`.trim(),
      data: {
        type: notification.type,
        notificationId: String(notification._id),
        actionUrl: notification.actionUrl || null,
      },
    });

    return notification;
  } catch (error) {
    console.error(
      `[notification] create failed (recipient=${notificationData?.recipient}, type=${notificationData?.type}):`,
      error.message
    );
    return null;
  }
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, read: false });
};

const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const notifications = await Notification.find({ recipient: userId })
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Notification.countDocuments({ recipient: userId });

  return { notifications, total };
};

module.exports = {
  create,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getUserNotifications,
};
