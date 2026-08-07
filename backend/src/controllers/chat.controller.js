const Chat = require('../models/Chat');
const Message = require('../models/Message');
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
      relatedProject: projectId || null,
    });

    await chat.populate('participants', 'name avatar');

    successResponse(res, 201, 'Group chat created successfully', chat);
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
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

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
      .populate('admins', 'name avatar');

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
    if (!chat.participants.includes(req.user._id)) {
      return errorResponse(res, 403, 'Not authorized');
    }

    const total = await Message.countDocuments({ chat: id, isDeleted: false });
    const messages = await Message.find({ chat: id, isDeleted: false })
      .populate('sender', 'name avatar')
      .populate('readBy.user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    paginatedResponse(res, 200, 'Messages retrieved successfully', messages.reverse(), page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Send message
exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, replyTo } = req.body;

    const chat = await Chat.findById(id);
    if (!chat) {
      return errorResponse(res, 404, 'Chat not found');
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user._id)) {
      return errorResponse(res, 403, 'Not authorized');
    }

    const message = await Message.create({
      chat: id,
      sender: req.user._id,
      content,
      replyTo: replyTo || null,
      readBy: [{ user: req.user._id }],
    });

    // Update last message in chat
    chat.lastMessage = message._id;
    await chat.save();

    await message.populate('sender', 'name avatar');

    successResponse(res, 201, 'Message sent successfully', message);
  } catch (error) {
    next(error);
  }
};

// Mark messages as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Message.updateMany(
      { chat: id, 'readBy.user': { $ne: req.user._id } },
      { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    successResponse(res, 200, 'Messages marked as read');
  } catch (error) {
    next(error);
  }
};

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

    // Check if user is admin
    if (!chat.admins.includes(req.user._id)) {
      return errorResponse(res, 403, 'Only admins can add participants');
    }

    if (chat.participants.includes(userId)) {
      return errorResponse(res, 400, 'User already in chat');
    }

    chat.participants.push(userId);
    await chat.save();

    await chat.populate('participants', 'name avatar');

    successResponse(res, 200, 'Participant added successfully', chat);
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
