const Notification = require('../models/Notification');
const User = require('../models/User');

const create = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    await notification.populate('sender', 'name avatar');
    return notification;
  } catch (error) {
    console.error('Notification error:', error);
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
