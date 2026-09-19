const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Project = require('../models/Project');
const { getIO } = require('../config/socket');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create or get direct chat
exports.createOrGetDirectChat = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    // Check if chat already exists
    let chat = await Chat.findOne({
      type: 'direct',
      participants: { $all: [req.user._id, recipientId] },
    }).populate('participants', 'name avatar');

    if (chat) {
      return successResponse(res, 200, 'Chat retrieved successfully', chat);
    }

    // Create new chat
    chat = await Chat.create({
      type: 'direct',
      participants: [req.user._id, recipientId],
    });

    await chat.populate('participants', 'name avatar');

    successResponse(res, 201, 'Chat created successfully', chat);
  } catch (error) {
    next(error);
  }
};

// Create group chat
exports.createGroupChat = async (req, res, next) => {
  try {
    const { name, description, members, projectId } = req.body;

    const allMembers = [req.user._id, ...(members || [])];

    const chat = await Chat.create({
      type: 'group',
      name,
      description,
      participants: allMembers,
      admins: [req.user._id],
      creator: req.user._id,
      relatedProject: projectId || null,
    });

    await chat.populate('participants', 'name avatar');
    await chat.populate('admins', 'name avatar');

    successResponse(res, 201, 'Group chat created successfully', chat);
  } catch (error) {
    next(error);
  }
};

// Get (or lazily create) the team chat for a project
exports.getOrCreateProjectChat = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    // Only project members (or the owner) can open the project chat
    const isMember =
      project.members.some((m) => m.user.toString() === req.user._id.toString()) ||
      project.owner.toString() === req.user._id.toString();
    if (!isMember) {
      return errorResponse(res, 403, 'Only project members can access this chat');
    }

    // Reuse an existing project chat if one exists
    let chat = await Chat.findOne({ type: 'group', relatedProject: projectId })
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('creator', 'name avatar');

    if (chat) {
      // Make sure the current user is a participant (they may have joined later)
      if (!chat.participants.some((p) => p._id.toString() === req.user._id.toString())) {
        chat.participants.push(req.user._id);
        await chat.save();
        await chat.populate('participants', 'name avatar');
      }
      return successResponse(res, 200, 'Project chat retrieved successfully', chat);
    }

    // Create a new project chat with all members + owner
    const memberIds = project.members.map((m) => m.user.toString());
    const allParticipants = Array.from(
      new Set([project.owner.toString(), ...memberIds])
    );

    chat = await Chat.create({
      type: 'group',
      name: `${project.title} Team`,
      description: `Chat for the "${project.title}" project`,
      participants: allParticipants,
      admins: [project.owner],
      creator: project.owner,
      relatedProject: projectId,
    });

    await chat.populate('participants', 'name avatar');
    await chat.populate('admins', 'name avatar');
    await chat.populate('creator', 'name avatar');

    successResponse(res, 201, 'Project chat created successfully', chat);
  } catch (error) {
    next(error);
  }
};

// Get all chats for user
exports.getMyChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('creator', 'name avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Fallback: a chat's lastMessage can be a stale reference (e.g. the message
    // was deleted). If so, attach the latest remaining message for the preview.
    for (const chat of chats) {
      if (chat.lastMessage) continue;
      const latest = await Message.findOne({
        chat: chat._id,
        isDeleted: false,
        deletedFor: { $ne: req.user._id },
      })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 });
      if (latest) chat.lastMessage = latest;
    }

    successResponse(res, 200, 'Chats retrieved successfully', chats);
  } catch (error) {
    next(error);
  }
};

// Get chat by ID
exports.getChatById = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('creator', 'name avatar');

    if (!chat) {
      return errorResponse(res, 404, 'Chat not found');
    }

    // Check if user is participant
    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return errorResponse(res, 403, 'Not authorized to access this chat');
    }

    successResponse(res, 200, 'Chat retrieved successfully', chat);
  } catch (error) {
    next(error);
  }
};

// Get messages for a chat
exports.getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const chat = await Chat.findById(id);
    if (!chat) {
      return errorResponse(res, 404, 'Chat not found');
    }

    // Check if user is participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return errorResponse(res, 403, 'Not authorized');
    }

    // Include deleted (isDeleted) messages so clients show a "deleted" placeholder;
    // hide only messages the requesting user deleted-for-themselves.
    const query = { chat: id, deletedFor: { $ne: req.user._id } };
    const total = await Message.countDocuments(query);
    const messages = await Message.find(query)
      .populate('sender', 'name avatar')
      .populate('readBy.user', 'name avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    paginatedResponse(res, 200, 'Messages retrieved successfully', messages.reverse(), page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Send message
// (REST send removed — messages are sent via the `message:send` socket event,
//  see src/sockets/chat.socket.js)

// Send a message with a file attachment (multipart: file + optional content)
exports.sendAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const chat = await Chat.findById(id);
    if (!chat) {
      return errorResponse(res, 404, 'Chat not found');
    }
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return errorResponse(res, 403, 'Not authorized');
    }
    if (!req.file) {
      return errorResponse(res, 400, 'No file uploaded');
    }

    const attachment = {
      public_id: req.file.filename,
      url: `${req.protocol}://${req.get('host')}/uploads/chat-files/${req.file.filename}`,
      name: req.file.originalname,
      type: req.file.mimetype,
    };

    const message = await Message.create({
      chat: id,
      sender: req.user._id,
      content: content || '',
      attachments: [attachment],
      readBy: [{ user: req.user._id }],
    });

    chat.lastMessage = message._id;
    await chat.save();

    await message.populate('sender', 'name avatar');

    // Realtime delivery to everyone in the chat room (including sender)
    getIO().to(`chat:${id}`).emit('message:received', message);

    successResponse(res, 201, 'Attachment sent successfully', message);
  } catch (error) {
    next(error);
  }
};

// Edit a message (sender only)
exports.editMessage = async (req, res, next) => {
  try {
    const { id, messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message || message.chat.toString() !== id) {
      return errorResponse(res, 404, 'Message not found');
    }
    if (message.sender.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized to edit this message');
    }
    if (!content || !content.trim()) {
      return errorResponse(res, 400, 'Message content is required');
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'name avatar');
    await message.populate('replyTo');

    getIO().to(`chat:${id}`).emit('message:edited', message);

    successResponse(res, 200, 'Message updated', message);
  } catch (error) {
    next(error);
  }
};

// Delete a message (sender only). scope: everyone (default) | me
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id, messageId } = req.params;
    const scope = req.query.scope || 'everyone';

    const message = await Message.findById(messageId);
    if (!message || message.chat.toString() !== id) {
      return errorResponse(res, 404, 'Message not found');
    }
    if (message.sender.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized to delete this message');
    }

    if (scope === 'me') {
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
      // Hide it on the deleter's other devices
      getIO().to(`user:${req.user._id}`).emit('message:deletedFor', {
        chatId: id,
        messageId,
        userId: req.user._id,
      });
    } else {
      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

      // If this was the chat's last message, point lastMessage at the latest
      // remaining (non-deleted) message so the sidebar preview stays valid.
      const chat = await Chat.findById(id);
      if (chat && chat.lastMessage?.toString() === message._id.toString()) {
        const latest = await Message.findOne({ chat: id, isDeleted: false })
          .sort({ createdAt: -1 })
          .select('_id');
        chat.lastMessage = latest?._id || null;
        await chat.save();
      }

      getIO().to(`chat:${id}`).emit('message:deleted', {
        chatId: id,
        messageId,
      });
    }

    successResponse(res, 200, scope === 'me' ? 'Message deleted for you' : 'Message deleted', {
      chatId: id,
      messageId,
      scope,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle an emoji reaction on a message
exports.reactToMessage = async (req, res, next) => {
  try {
    const { id, messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message || message.chat.toString() !== id) {
      return errorResponse(res, 404, 'Message not found');
    }
    if (!emoji) {
      return errorResponse(res, 400, 'Emoji is required');
    }

    const existing = message.reactions.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (existing) {
      if (existing.emoji === emoji) {
        message.reactions = message.reactions.filter(
          (r) => r.user.toString() !== req.user._id.toString()
        );
      } else {
        existing.emoji = emoji;
      }
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }
    await message.save();

    getIO().to(`chat:${id}`).emit('message:reacted', {
      chatId: id,
      messageId,
      reactions: message.reactions,
    });

    successResponse(res, 200, 'Reaction updated', {
      messageId,
      reactions: message.reactions,
    });
  } catch (error) {
    next(error);
  }
};

// Mark messages as read
// (REST read removed — read receipts flow through the `messages:read` socket
//  event, see src/sockets/chat.socket.js)

// Add participant to group
exports.addParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findById(id);
    if (!chat) {
      return errorResponse(res, 404, 'Chat not found');
    }

    if (chat.type !== 'group') {
      return errorResponse(res, 400, 'Cannot add participants to direct chat');
    }

    // Any current member can add new members (WhatsApp-style)
    if (!chat.participants.some((p) => p.toString() === req.user._id.toString())) {
      return errorResponse(res, 403, 'Only team members can add participants');
    }

    if (chat.participants.some(p => p.toString() === userId.toString())) {
      return errorResponse(res, 400, 'User already in chat');
    }

    chat.participants.push(userId);
    await chat.save();

    await chat.populate('participants', 'name avatar');
    await chat.populate('admins', 'name avatar');

    successResponse(res, 200, 'Participant added successfully', chat);
  } catch (error) {
    next(error);
  }
};

// Remove a participant (admins only, WhatsApp-style)
exports.removeParticipant = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const chat = await Chat.findById(id);
    if (!chat) {
      return errorResponse(res, 404, 'Chat not found');
    }
    if (chat.type !== 'group') {
      return errorResponse(res, 400, 'Cannot remove from direct chat');
    }
    if (!chat.admins.some(a => a.toString() === req.user._id.toString())) {
      return errorResponse(res, 403, 'Only admins can remove members');
    }

    if (!chat.participants.some(p => p.toString() === userId.toString())) {
      return errorResponse(res, 400, 'User is not in the chat');
    }
    // Can't remove the creator/admin themselves this way
    if (userId === chat.creator?.toString()) {
      return errorResponse(res, 400, 'Cannot remove the team creator');
    }

    chat.participants = chat.participants.filter((p) => p.toString() !== userId);
    chat.admins = chat.admins.filter((a) => a.toString() !== userId);
    await chat.save();

    await chat.populate('participants', 'name avatar');
    await chat.populate('admins', 'name avatar');

    getIO().to(`chat:${id}`).emit('chat:member-removed', { chatId: id, userId });

    successResponse(res, 200, 'Participant removed successfully', chat);
  } catch (error) {
    next(error);
  }
};

// Promote a participant to admin (admins only)
exports.promoteToAdmin = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const chat = await Chat.findById(id);
    if (!chat) {
      return errorResponse(res, 404, 'Chat not found');
    }
    if (chat.type !== 'group') {
      return errorResponse(res, 400, 'Not a group chat');
    }
    if (!chat.admins.some(a => a.toString() === req.user._id.toString())) {
      return errorResponse(res, 403, 'Only admins can promote members');
    }
    if (!chat.participants.some(p => p.toString() === userId.toString())) {
      return errorResponse(res, 400, 'User is not in the chat');
    }
    if (chat.admins.some(a => a.toString() === userId.toString())) {
      return errorResponse(res, 400, 'User is already an admin');
    }

    chat.admins.push(userId);
    await chat.save();

    await chat.populate('participants', 'name avatar');
    await chat.populate('admins', 'name avatar');

    getIO().to(`chat:${id}`).emit('chat:admin-added', { chatId: id, userId });

    successResponse(res, 200, 'User promoted to admin', chat);
  } catch (error) {
    next(error);
  }
};

// Leave chat
exports.leaveChat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id);
    if (!chat) {
      return errorResponse(res, 404, 'Chat not found');
    }

    if (chat.type === 'direct') {
      return errorResponse(res, 400, 'Cannot leave direct chat');
    }

    chat.participants = chat.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );

    // If no participants left, delete chat
    if (chat.participants.length === 0) {
      await chat.deleteOne();
      return successResponse(res, 200, 'Chat deleted');
    }

    // Remove from admins if applicable
    chat.admins = chat.admins.filter(
      a => a.toString() !== req.user._id.toString()
    );

    await chat.save();

    successResponse(res, 200, 'Left chat successfully');
  } catch (error) {
    next(error);
  }
};
