const Message = require('../models/Message');
const Chat = require('../models/Chat');
const notificationService = require('../services/notification.service');
const { resolveMentionedUsers } = require('../utils/mentions');

// userId -> Set<socketId>. Multi-tab/multi-device safe: a user is only
// "offline" after their last socket disconnects.
const activeUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user to their personal room (identity from verified handshake only)
    socket.on('join', () => {
      const userId = socket.userId;
      if (!userId) return;

      socket.join(`user:${userId}`);

      if (!activeUsers.has(userId)) {
        activeUsers.set(userId, new Set());
      }
      const isFirstConnection = activeUsers.get(userId).size === 0;
      activeUsers.get(userId).add(socket.id);

      // Reply with who is currently online so late joiners render dots
      // without needing to have witnessed past online/offline transitions.
      socket.emit(
        'presence:snapshot',
        Array.from(activeUsers.keys())
      );

      // Only broadcast online on the first connection for this user
      if (isFirstConnection) {
        io.emit('user:online', userId);
      }
    });

    // Join a chat room
    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    // Leave a chat room
    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // Send message (sender identity comes from the authenticated socket,
    // never from client-supplied data). Acknowledges with the saved message
    // so the sender can render it even if the room broadcast is missed.
    socket.on('message:send', async (data, callback) => {
      try {
        const senderId = socket.userId;
        if (!senderId) return;

        const { chatId, content, replyTo } = data;

        if (!chatId || typeof content !== 'string' || !content.trim()) return;

        const message = await Message.create({
          chat: chatId,
          sender: senderId,
          content: content.trim(),
          replyTo: replyTo || null,
          readBy: [{ user: senderId }],
        });

        await message.populate('sender', 'name avatar');
        await message.populate('replyTo');

        // Update last message in chat
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

        io.to(`chat:${chatId}`).emit('message:received', message);

        if (typeof callback === 'function') {
          callback({ ok: true, message });
        }

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

        // Mentions — notify referenced chat members (never the sender)
        const sender = chat.participants.find(
          (p) => p._id.toString() === senderId.toString()
        );
        const mentionedUsers = await resolveMentionedUsers(content || '', {
          excludeIds: [senderId],
        });
        for (const mentioned of mentionedUsers) {
          const isMember = chat.participants.some(
            (p) => p._id.toString() === mentioned._id.toString()
          );
          if (!isMember) continue;

          await notificationService.create({
            recipient: mentioned._id,
            sender: senderId,
            type: 'mention',
            title: 'You were mentioned',
            message: `${sender ? sender.name : 'Someone'} mentioned you in ${
              chat.type === 'group' ? `"${chat.name || 'a team chat'}"` : 'a conversation'
            }`,
            actionUrl: `/chat/${chatId}`,
          });
        }
      } catch (error) {
        console.error('Message error:', error);
        if (typeof callback === 'function') {
          callback({ ok: false });
        }
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

      const userId = socket.userId;
      if (!userId) return;

      const sockets = activeUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);
      if (sockets.size === 0) {
        activeUsers.delete(userId);
        io.emit('user:offline', userId);
      }
    });
  });
};
