const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const notificationService = require('../services/notification.service');
const { isChatParticipant, getChatPeers } = require('../services/chatAccess.service');
const { resolveMentionedUsers } = require('../utils/mentions');

// userId -> Set<socketId>. Multi-tab/multi-device safe: a user is only
// "offline" after their last socket disconnects.
const activeUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user to their personal room (identity from verified handshake only)
    socket.on('join', async () => {
      const userId = socket.userId;
      if (!userId) return;

      socket.join(`user:${userId}`);

      if (!activeUsers.has(userId)) {
        activeUsers.set(userId, new Set());
      }
      const isFirstConnection = activeUsers.get(userId).size === 0;
      activeUsers.get(userId).add(socket.id);

      // Only reveal the presence of people this user actually corresponds
      // with. Broadcasting the full online list leaked the existence and
      // activity of users in unrelated (including private) conversations.
      const onlineIds = Array.from(activeUsers.keys());
      const visible = await getChatPeers(userId, onlineIds);
      // The user themselves is always visible.
      visible.add(userId.toString());

      socket.emit('presence:snapshot', Array.from(visible));

      // Only broadcast online on the first connection for this user, and only
      // to the people entitled to see it.
      if (isFirstConnection) {
        const audience = await getChatPeers(userId, onlineIds);
        for (const peerId of audience) {
          io.to(`user:${peerId}`).emit('user:online', userId);
        }
      }
    });

    // Join a chat room. Membership is mandatory: without this check any
    // authenticated user could subscribe to any chat and receive its messages
    // in realtime, bypassing the authorization the REST path enforces.
    socket.on('chat:join', async (chatId) => {
      if (!(await isChatParticipant(chatId, socket.userId))) return;
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

        // Membership is checked BEFORE the write, so a non-participant cannot
        // inject a message into someone else's chat, and an unknown chatId
        // cannot leave an orphaned message row behind.
        if (!(await isChatParticipant(chatId, senderId))) {
          if (typeof callback === 'function') {
            callback({ ok: false, error: 'Not authorized for this chat' });
          }
          return;
        }

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

        // Notify participants who are not in the chat. This is a transient
        // unread badge only — no Notification row is created — so it uses its
        // own event name. It previously shared 'notification' with the real
        // notification service under a second, incompatible payload shape,
        // which forced every client to sniff the payload.
        const chat = await Chat.findById(chatId).populate('participants');
        if (!chat) return;
        chat.participants.forEach((participant) => {
          if (participant._id.toString() !== senderId) {
            io.to(`user:${participant._id}`).emit('chat:unread', {
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

    // Typing indicator. Identity comes from the socket, never the payload —
    // a client-supplied userId would let anyone spoof another user's typing.
    socket.on('typing:start', async (data) => {
      const { chatId } = data || {};
      if (!(await isChatParticipant(chatId, socket.userId))) return;
      const user = await User.findById(socket.userId).select('name');
      socket.to(`chat:${chatId}`).emit('typing:user', {
        userId: socket.userId,
        userName: user?.name || 'Someone',
      });
    });

    socket.on('typing:stop', (data) => {
      const { chatId } = data || {};
      socket.to(`chat:${chatId}`).emit('typing:stopped', { userId: socket.userId });
    });

    // Mark as read. A receipt records that THIS socket's user read the chat —
    // accepting a client-supplied userId would let anyone forge receipts for
    // other users and destroy the trust signal.
    socket.on('messages:read', async (data) => {
      const { chatId } = data || {};
      const userId = socket.userId;
      if (!userId) return;
      if (!(await isChatParticipant(chatId, userId))) return;

      await Message.updateMany(
        { chat: chatId, 'readBy.user': { $ne: userId } },
        { $push: { readBy: { user: userId, readAt: new Date() } } }
      );
      // socket.to, not io.to: the reader has already applied this locally, so
      // echoing it back only forces clients to special-case their own id.
      socket.to(`chat:${chatId}`).emit('messages:read', { chatId, userId });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);

      const userId = socket.userId;
      if (!userId) return;

      const sockets = activeUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);
      if (sockets.size === 0) {
        activeUsers.delete(userId);
        // Scoped for the same reason as user:online — a global broadcast told
        // unrelated users that this person had gone offline.
        const audience = await getChatPeers(userId, Array.from(activeUsers.keys()));
        for (const peerId of audience) {
          io.to(`user:${peerId}`).emit('user:offline', userId);
        }
      }
    });
  });
};
