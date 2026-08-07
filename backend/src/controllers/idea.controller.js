const Idea = require('../models/Idea');
const Comment = require('../models/Comment');
const User = require('../models/User');
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
