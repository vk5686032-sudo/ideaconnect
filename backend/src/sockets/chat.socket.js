const Message = require('../models/Message');
const Chat = require('../models/Chat');
const notificationService = require('../services/notification.service');

const activeUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user to their personal room
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      activeUsers.set(userId, socket.id);
      io.emit('user:online', userId);
    });

    // Join a chat room
    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    // Leave a chat room
    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // Send message
    socket.on('message:send', async (data) => {
      try {
        const { chatId, content, senderId, replyTo } = data;

        const message = await Message.create({
          chat: chatId,
          sender: senderId,
          content,
          replyTo: replyTo || null,
          readBy: [{ user: senderId }],
        });

        await message.populate('sender', 'name avatar');

        // Update last message in chat
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

        io.to(`chat:${chatId}`).emit('message:received', message);

        // Notify participants who are not in the chat
        const chat = await Chat.findById(chatId).populate('participants');
        chat.participants.forEach((participant) => {
          if (participant._id.toString() !== senderId) {
            io.to(`user:${participant._id}`).emit('notification', {
              type: 'new_message',
              chatId,
              message,
            });
          }
        });
      } catch (error) {
        console.error('Message error:', error);
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      const { chatId, userId, userName } = data;
      socket.to(`chat:${chatId}`).emit('typing:user', { userId, userName });
    });

    socket.on('typing:stop', (data) => {
      const { chatId, userId } = data;
      socket.to(`chat:${chatId}`).emit('typing:stopped', { userId });
    });

    // Mark as read
    socket.on('messages:read', async (data) => {
      const { chatId, userId } = data;
      await Message.updateMany(
        { chat: chatId, 'readBy.user': { $ne: userId } },
        { $push: { readBy: { user: userId, readAt: new Date() } } }
      );
      io.to(`chat:${chatId}`).emit('messages:read', { chatId, userId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      for (const [userId, socketId] of activeUsers) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          io.emit('user:offline', userId);
          break;
        }
      }
    });
  });
};
