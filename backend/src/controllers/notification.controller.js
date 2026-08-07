const notificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/response');

// Get current user's notifications
exports.getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const { notifications, total } = await notificationService.getUserNotifications(
      req.user._id,
      page,
      limit
    );

    successResponse(res, 200, 'Notifications retrieved successfully', {
      notifications,
      total,
      unreadCount: await notificationService.getUnreadCount(req.user._id),
    });
  } catch (error) {
    next(error);
  }
};

// Get unread count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    successResponse(res, 200, 'Unread count retrieved', { count });
  } catch (error) {
    next(error);
  }
};

// Mark single notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }
    successResponse(res, 200, 'Notification marked as read', notification);
  } catch (error) {
    next(error);
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    successResponse(res, 200, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};
