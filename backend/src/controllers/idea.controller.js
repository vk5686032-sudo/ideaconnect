const Idea = require('../models/Idea');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Project = require('../models/Project');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const cloudinary = require('../config/cloudinary');
const notificationService = require('../services/notification.service');

// Create idea
exports.createIdea = async (req, res, next) => {
  try {
    const { title, description, category, tags, requiredSkills, visibility, status } = req.body;

    const idea = await Idea.create({
      title,
      description,
      author: req.user._id,
      category,
      tags: tags || [],
      requiredSkills: requiredSkills || [],
      visibility: visibility || 'public',
      status: status || 'open',
    });

    // Add to user's ideas
    await User.findByIdAndUpdate(req.user._id, {
      $push: { ideasCreated: idea._id },
    });

    await idea.populate('author', 'name avatar');

    successResponse(res, 201, 'Idea created successfully', idea);
  } catch (error) {
    next(error);
  }
};

// Get all ideas
exports.getAllIdeas = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const status = req.query.status;
    const search = req.query.search;
    const sort = req.query.sort || 'newest';

    const query = { visibility: 'public' };

    if (category) query.category = category;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { likes: -1 };
        break;
      case 'trending':
        sortOption = { views: -1, likes: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const total = await Idea.countDocuments(query);
    const ideas = await Idea.find(query)
      .populate('author', 'name avatar')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    paginatedResponse(res, 200, 'Ideas retrieved successfully', ideas, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Get idea by ID
exports.getIdeaById = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('author', 'name avatar bio skills')
      .populate('team.user', 'name avatar')
      .populate('aiAnalysis.similarIdeas', 'title category')
      .populate('mentorReviews.mentor', 'name avatar');

    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    // Increment views
    idea.views += 1;
    await idea.save();

    successResponse(res, 200, 'Idea retrieved successfully', idea);
  } catch (error) {
    next(error);
  }
};

// Update idea
exports.updateIdea = async (req, res, next) => {
  try {
    let idea = await Idea.findById(req.params.id);

    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    // Check ownership
    if (idea.author.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized to update this idea');
    }

    const updateData = { ...req.body };
    delete updateData.author;
    delete updateData.likes;
    delete updateData.bookmarks;

    idea = await Idea.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('author', 'name avatar');

    successResponse(res, 200, 'Idea updated successfully', idea);
  } catch (error) {
    next(error);
  }
};

// Delete idea
exports.deleteIdea = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    if (idea.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to delete this idea');
    }

    // Delete images from cloudinary
    if (idea.images && idea.images.length > 0) {
      for (const image of idea.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    // Delete comments
    await Comment.deleteMany({ idea: idea._id });

    await idea.deleteOne();

    successResponse(res, 200, 'Idea deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Like/Unlike idea
exports.toggleLike = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    const isLiked = idea.likes.includes(req.user._id);

    if (isLiked) {
      idea.likes.pull(req.user._id);
    } else {
      idea.likes.push(req.user._id);
      // Send notification
      if (idea.author.toString() !== req.user._id.toString()) {
        await notificationService.create({
          recipient: idea.author,
          sender: req.user._id,
          type: 'like',
          title: 'New like on your idea',
          message: `${req.user.name} liked your idea "${idea.title}"`,
          relatedIdea: idea._id,
          actionUrl: `/ideas/${idea._id}`,
        });
      }
    }

    await idea.save();

    successResponse(res, 200, isLiked ? 'Idea unliked' : 'Idea liked', {
      likesCount: idea.likes.length,
      isLiked: !isLiked,
    });
  } catch (error) {
    next(error);
  }
};

// Bookmark/Unbookmark idea
exports.toggleBookmark = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    const isBookmarked = idea.bookmarks.includes(req.user._id);

    if (isBookmarked) {
      idea.bookmarks.pull(req.user._id);
    } else {
      idea.bookmarks.push(req.user._id);
    }

    await idea.save();

    successResponse(res, 200, isBookmarked ? 'Bookmark removed' : 'Idea bookmarked', {
      isBookmarked: !isBookmarked,
    });
  } catch (error) {
    next(error);
  }
};

// Get my ideas
exports.getMyIdeas = async (req, res, next) => {
  try {
    const ideas = await Idea.find({ author: req.user._id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'My ideas retrieved successfully', ideas);
  } catch (error) {
    next(error);
  }
};

// Get bookmarked ideas
exports.getBookmarkedIdeas = async (req, res, next) => {
  try {
    const ideas = await Idea.find({ bookmarks: req.user._id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'Bookmarked ideas retrieved successfully', ideas);
  } catch (error) {
    next(error);
  }
};

// Request to start project from idea
exports.requestStartProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const idea = await Idea.findById(id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    // Check if idea is already converted to a project
    if (idea.convertedToProject) {
      return errorResponse(res, 400, 'This idea has already been converted to a project');
    }

    // Check if user is the author (can't request own idea)
    if (idea.author.toString() === req.user._id.toString()) {
      return errorResponse(res, 400, 'You cannot request to start a project from your own idea. Use "Convert to Project" directly.');
    }

    // Check for existing pending request from this user
    const existingRequest = await Invitation.findOne({
      sender: req.user._id,
      relatedIdea: id,
      type: 'start-project-request',
      status: 'pending',
    });

    if (existingRequest) {
      return errorResponse(res, 400, 'You already have a pending request for this idea');
    }

    // Create invitation/request
    const invitation = await Invitation.create({
      sender: req.user._id,
      recipient: idea.author,
      type: 'start-project-request',
      relatedIdea: id,
      message: message || '',
    });

    // Notify idea owner
    await notificationService.create({
      recipient: idea.author,
      sender: req.user._id,
      type: 'start-project-request',
      title: 'Project Start Request',
      message: `${req.user.name} requested to start a project from your idea "${idea.title}"`,
      relatedIdea: idea._id,
      relatedInvitation: invitation._id,
      actionUrl: `/ideas/${idea._id}`,
    });

    successResponse(res, 201, 'Request sent successfully', invitation);
  } catch (error) {
    next(error);
  }
};

// Get pending start-project requests for an idea (owner only)
exports.getStartProjectRequests = async (req, res, next) => {
  try {
    const { id } = req.params;

    const idea = await Idea.findById(id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    // Only author can see requests
    if (idea.author.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only the idea author can view start-project requests');
    }

    const requests = await Invitation.find({
      relatedIdea: id,
      type: 'start-project-request',
    })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'Start project requests retrieved successfully', requests);
  } catch (error) {
    next(error);
  }
};

// Get the current user's own start-project request for an idea
exports.getMyStartProjectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await Invitation.findOne({
      sender: req.user._id,
      relatedIdea: id,
      type: 'start-project-request',
    }).sort({ createdAt: -1 });

    successResponse(res, 200, 'Start project request retrieved successfully', request);
  } catch (error) {
    next(error);
  }
};

// Handle (approve/reject) start-project request
exports.handleStartProjectRequest = async (req, res, next) => {
  try {
    const { requestId, action } = req.params; // action: 'approve' or 'reject'

    const invitation = await Invitation.findById(requestId)
      .populate('relatedIdea', 'title author')
      .populate('sender', 'name');

    if (!invitation) {
      return errorResponse(res, 404, 'Request not found');
    }

    // Verify the current user is the idea author
    if (invitation.relatedIdea.author.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized to handle this request');
    }

    if (invitation.status !== 'pending') {
      return errorResponse(res, 400, 'This request has already been handled');
    }

    if (action === 'approve') {
      invitation.status = 'accepted';

      // Notify requester: approved - they can now convert to project
      await notificationService.create({
        recipient: invitation.sender._id,
        sender: req.user._id,
        type: 'start-project-approved',
        title: 'Request Approved: Convert to Project',
        message: `Your request to start a project from "${invitation.relatedIdea.title}" was approved. You can now convert it to a project.`,
        relatedIdea: invitation.relatedIdea._id,
        relatedInvitation: invitation._id,
        actionUrl: `/ideas/${invitation.relatedIdea._id}`,
      });
    } else if (action === 'reject') {
      invitation.status = 'rejected';

      // Notify requester: rejected
      await notificationService.create({
        recipient: invitation.sender._id,
        sender: req.user._id,
        type: 'start-project-rejected',
        title: 'Request Declined',
        message: `Your request to start a project from "${invitation.relatedIdea.title}" was not selected. You can re-apply if circumstances change.`,
        relatedIdea: invitation.relatedIdea._id,
        relatedInvitation: invitation._id,
        actionUrl: `/ideas/${invitation.relatedIdea._id}`,
      });
    } else {
      return errorResponse(res, 400, 'Invalid action. Use "approve" or "reject"');
    }

    await invitation.save();

    successResponse(res, 200, `Request ${action}d successfully`, invitation);
  } catch (error) {
    next(error);
  }
};
