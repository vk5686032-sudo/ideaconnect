const Idea = require('../models/Idea');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Project = require('../models/Project');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const cloudinary = require('../config/cloudinary');
const notificationService = require('../services/notification.service');
const reputationService = require('../services/reputation.service');

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

    // Drafts are work-in-progress — never shown in public browse.
    if (status) {
      query.status = status;
      if (status === 'draft') {
        return paginatedResponse(res, 200, 'Ideas retrieved successfully', [], page, limit, 0);
      }
    } else {
      query.status = { $ne: 'draft' };
    }

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

    // Visibility: private / invite-only ideas are only visible to the
    // author, admins, and idea team members
    if (idea.visibility !== 'public') {
      const isAuthor = idea.author._id.toString() === req.user?._id?.toString();
      const isAdmin = req.user?.role === 'admin';
      const isTeamMember =
        req.user &&
        (idea.team || []).some(
          (m) => m.user && m.user._id.toString() === req.user._id.toString()
        );

      if (!isAuthor && !isAdmin && !isTeamMember) {
        return errorResponse(res, 404, 'Idea not found');
      }
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

    const isLiked = idea.likes.some(id => id.toString() === req.user._id.toString());

    if (isLiked) {
      idea.likes = idea.likes.filter(id => id.toString() !== req.user._id.toString());
      // Reverse the author's reputation gain from the removed like
      if (idea.author.toString() !== req.user._id.toString()) {
        await reputationService.award(idea.author, -reputationService.POINTS.IDEA_LIKED);
      }
    } else {
      idea.likes.push(req.user._id);
      // Send notification
      if (idea.author.toString() !== req.user._id.toString()) {
        await reputationService.award(idea.author, reputationService.POINTS.IDEA_LIKED);
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

    const isBookmarked = idea.bookmarks.some(id => id.toString() === req.user._id.toString());

    if (isBookmarked) {
      idea.bookmarks = idea.bookmarks.filter(id => id.toString() !== req.user._id.toString());
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

// Add or update a mentor review on an idea
exports.addMentorReview = async (req, res, next) => {
  try {
    const { review, rating } = req.body;

    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    // Mentors can't review their own ideas
    if (idea.author.toString() === req.user._id.toString()) {
      return errorResponse(res, 400, 'You cannot review your own idea');
    }

    // Upsert: one review per mentor per idea
    const existingReview = idea.mentorReviews.find(
      (r) => r.mentor && r.mentor.toString() === req.user._id.toString()
    );

    if (existingReview) {
      existingReview.review = review;
      existingReview.rating = rating;
      existingReview.createdAt = new Date();
    } else {
      idea.mentorReviews.push({ mentor: req.user._id, review, rating });
      // Reward the mentor for contributing expert feedback
      await reputationService.award(req.user._id, reputationService.POINTS.MENTOR_REVIEW_GIVEN);
    }

    await idea.save();
    await idea.populate('mentorReviews.mentor', 'name avatar');

    // Notify the idea author
    await notificationService.create({
      recipient: idea.author,
      sender: req.user._id,
      type: 'mentor-review',
      title: existingReview ? 'Mentor Review Updated' : 'New Mentor Review',
      message: `${req.user.name} ${existingReview ? 'updated' : 'added'} a mentor review on your idea "${idea.title}"`,
      relatedIdea: idea._id,
      actionUrl: `/ideas/${idea._id}`,
    });

    successResponse(res, 200, existingReview ? 'Review updated successfully' : 'Review added successfully', {
      mentorReviews: idea.mentorReviews,
    });
  } catch (error) {
    next(error);
  }
};

// Delete the current mentor's review from an idea
exports.deleteMentorReview = async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    const existingReview = idea.mentorReviews.find(
      (r) => r.mentor && r.mentor.toString() === req.user._id.toString()
    );

    if (!existingReview) {
      return errorResponse(res, 404, 'You have not reviewed this idea');
    }

    idea.mentorReviews.pull(existingReview);
    await idea.save();
    await reputationService.award(req.user._id, -reputationService.POINTS.MENTOR_REVIEW_GIVEN);

    successResponse(res, 200, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ============ IDEA TEAM MANAGEMENT ============

// Owner invites a user to join the idea team (needed for invite-only ideas)
exports.inviteToIdea = async (req, res, next) => {
  try {
    const { userId, role, message } = req.body;

    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    const isOwner = idea.author.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Only the idea author can invite team members');
    }

    const invitee = await User.findById(userId);
    if (!invitee) {
      return errorResponse(res, 404, 'User not found');
    }
    if (invitee._id.toString() === idea.author.toString()) {
      return errorResponse(res, 400, 'The author is already part of this idea');
    }

    // Already on the team?
    const alreadyMember = (idea.team || []).some(
      (m) => m.user && m.user.toString() === userId
    );
    if (alreadyMember) {
      return errorResponse(res, 400, 'This user is already on the idea team');
    }

    // Duplicate pending invite guard
    const existingInvite = await Invitation.findOne({
      sender: req.user._id,
      recipient: userId,
      relatedIdea: idea._id,
      type: 'idea-invite',
      status: 'pending',
    });
    if (existingInvite) {
      return errorResponse(res, 400, 'This user already has a pending invitation');
    }

    const invitation = await Invitation.create({
      sender: req.user._id,
      recipient: userId,
      type: 'idea-invite',
      relatedIdea: idea._id,
      role: role || 'member',
      message: message || '',
    });

    await notificationService.create({
      recipient: userId,
      sender: req.user._id,
      type: 'invitation',
      title: 'Idea Team Invitation',
      message: `${req.user.name} invited you to collaborate on "${idea.title}"`,
      relatedIdea: idea._id,
      relatedInvitation: invitation._id,
      actionUrl: '/dashboard',
    });

    successResponse(res, 201, 'Invitation sent successfully', invitation);
  } catch (error) {
    next(error);
  }
};

// Accept or reject an idea team invitation (recipient only)
exports.handleIdeaInvite = async (req, res, next) => {
  try {
    const { invitationId, action } = req.params;

    const invitation = await Invitation.findOne({
      _id: invitationId,
      type: 'idea-invite',
    }).populate('relatedIdea', 'title');

    if (!invitation) {
      return errorResponse(res, 404, 'Invitation not found');
    }

    if (invitation.recipient.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized to handle this invitation');
    }

    // Lazy expiry check — a stale pending invite expires on touch
    if (
      invitation.status === 'pending' &&
      invitation.expiresAt &&
      invitation.expiresAt < new Date()
    ) {
      invitation.status = 'expired';
      await invitation.save();
      return errorResponse(res, 400, 'This invitation has expired');
    }

    if (invitation.status !== 'pending') {
      return errorResponse(res, 400, 'This invitation has already been handled');
    }

    if (action === 'accept') {
      // Re-check membership at accept-time (may have joined another way)
      const idea = await Idea.findById(invitation.relatedIdea._id);
      if (!idea) {
        return errorResponse(res, 404, 'The idea no longer exists');
      }
      const alreadyMember = (idea.team || []).some(
        (m) => m.user && m.user.toString() === req.user._id.toString()
      );
      if (!alreadyMember) {
        idea.team.push({ user: req.user._id, role: invitation.role || 'member' });
        await idea.save();
      }
      invitation.status = 'accepted';

      await notificationService.create({
        recipient: invitation.sender._id || invitation.sender,
        sender: req.user._id,
        type: 'project-update',
        title: 'Invitation Accepted',
        message: `${req.user.name} accepted your invitation to collaborate on "${invitation.relatedIdea.title}"`,
        relatedIdea: idea._id,
        actionUrl: `/ideas/${idea._id}`,
      });
    } else if (action === 'reject') {
      invitation.status = 'rejected';
    } else {
      return errorResponse(res, 400, 'Invalid action. Use "accept" or "reject"');
    }

    await invitation.save();

    successResponse(res, 200, `Invitation ${action}ed successfully`, invitation);
  } catch (error) {
    next(error);
  }
};

// List incoming idea invitations for the current user
exports.getMyIdeaInvites = async (req, res, next) => {
  try {
    const invitations = await Invitation.find({
      recipient: req.user._id,
      type: 'idea-invite',
    })
      .populate('sender', 'name avatar')
      .populate('relatedIdea', 'title category')
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'Idea invitations retrieved successfully', invitations);
  } catch (error) {
    next(error);
  }
};

// Owner removes a member from the idea team
exports.removeTeamMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const idea = await Idea.findById(id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    if (idea.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Only the idea author can manage the team');
    }

    const wasMember = (idea.team || []).some(
      (m) => m.user && m.user.toString() === userId
    );
    if (!wasMember) {
      return errorResponse(res, 404, 'This user is not on the idea team');
    }

    idea.team = idea.team.filter((m) => m.user.toString() !== userId);
    await idea.save();

    successResponse(res, 200, 'Team member removed successfully');
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

    // Lazy expiry — a stale pending request expires on touch
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return errorResponse(res, 400, 'This request has expired');
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
