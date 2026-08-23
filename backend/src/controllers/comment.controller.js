const Comment = require('../models/Comment');
const Idea = require('../models/Idea');
const { successResponse, errorResponse } = require('../utils/response');
const notificationService = require('../services/notification.service');
const reputationService = require('../services/reputation.service');
const { resolveMentionedUsers } = require('../utils/mentions');

// Create comment
exports.createComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    const { ideaId } = req.params;

    const idea = await Idea.findById(ideaId);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    const isReply = !!parentId;
    let parentComment = null;

    const commentData = {
      content,
      author: req.user._id,
      idea: ideaId,
    };

    if (isReply) {
      parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return errorResponse(res, 404, 'Parent comment not found');
      }
      commentData.parent = parentId;
    }

    const comment = await Comment.create(commentData);

    // Add to parent's replies if it's a reply
    if (isReply) {
      await Comment.findByIdAndUpdate(parentId, {
        $push: { replies: comment._id },
      });
    }

    // Update comments count
    await Idea.findByIdAndUpdate(ideaId, { $inc: { commentsCount: 1 } });

    // Track who was already notified so mentions don't double-notify
    let notifiedRecipient = null;

    // Send notification
    if (isReply) {
      if (parentComment && parentComment.author.toString() !== req.user._id.toString()) {
        notifiedRecipient = parentComment.author.toString();
        await reputationService.award(notifiedRecipient, reputationService.POINTS.REPLY_RECEIVED);
        await notificationService.create({
          recipient: notifiedRecipient,
          sender: req.user._id,
          type: 'reply',
          title: 'New reply to your comment',
          message: `${req.user.name} replied to your comment`,
          relatedIdea: ideaId,
          relatedComment: comment._id,
          actionUrl: `/ideas/${ideaId}#comment-${comment._id}`,
        });
      }
    } else if (idea.author.toString() !== req.user._id.toString()) {
      notifiedRecipient = idea.author.toString();
      await reputationService.award(notifiedRecipient, reputationService.POINTS.COMMENT_RECEIVED);
      await notificationService.create({
        recipient: notifiedRecipient,
        sender: req.user._id,
        type: 'comment',
        title: 'New comment on your idea',
        message: `${req.user.name} commented on "${idea.title}"`,
        relatedIdea: ideaId,
        relatedComment: comment._id,
        actionUrl: `/ideas/${ideaId}#comment-${comment._id}`,
      });
    }

    // Mentions — notify referenced users (skip self + already-notified recipient)
    const mentionedUsers = await resolveMentionedUsers(content, {
      excludeIds: [req.user._id.toString(), ...(notifiedRecipient ? [notifiedRecipient] : [])],
    });
    for (const mentioned of mentionedUsers) {
      await notificationService.create({
        recipient: mentioned._id,
        sender: req.user._id,
        type: 'mention',
        title: 'You were mentioned',
        message: `${req.user.name} mentioned you in a comment on "${idea.title}"`,
        relatedIdea: ideaId,
        relatedComment: comment._id,
        actionUrl: `/ideas/${ideaId}#comment-${comment._id}`,
      });
    }

    await comment.populate('author', 'name avatar');

    successResponse(res, 201, 'Comment added successfully', comment);
  } catch (error) {
    next(error);
  }
};

// Get comments for an idea
exports.getComments = async (req, res, next) => {
  try {
    const { ideaId } = req.params;

    const comments = await Comment.find({ idea: ideaId, parent: null })
      .populate('author', 'name avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'name avatar',
        },
      })
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'Comments retrieved successfully', comments);
  } catch (error) {
    next(error);
  }
};

// Update comment
exports.updateComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return errorResponse(res, 404, 'Comment not found');
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized to update this comment');
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = Date.now();
    await comment.save();

    await comment.populate('author', 'name avatar');

    successResponse(res, 200, 'Comment updated successfully', comment);
  } catch (error) {
    next(error);
  }
};

// Delete comment
exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return errorResponse(res, 404, 'Comment not found');
    }

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to delete this comment');
    }

    // Update comments count
    await Idea.findByIdAndUpdate(comment.idea, { $inc: { commentsCount: -1 } });

    // Remove from parent's replies
    if (comment.parent) {
      await Comment.findByIdAndUpdate(comment.parent, {
        $pull: { replies: comment._id },
      });
    }

    // Delete all replies
    await Comment.deleteMany({ parent: comment._id });

    await comment.deleteOne();

    successResponse(res, 200, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Like/Unlike comment
exports.toggleLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return errorResponse(res, 404, 'Comment not found');
    }

    const isLiked = comment.likes.includes(req.user._id);

    if (isLiked) {
      comment.likes.pull(req.user._id);
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();

    successResponse(res, 200, isLiked ? 'Comment unliked' : 'Comment liked', {
      likesCount: comment.likes.length,
      isLiked: !isLiked,
    });
  } catch (error) {
    next(error);
  }
};
