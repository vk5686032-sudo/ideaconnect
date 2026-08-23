const Idea = require('../models/Idea');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/response');

const TARGET_MODELS = {
  idea: Idea,
  project: Project,
  comment: Comment,
  user: User,
};

// Report inappropriate content (ideas, projects, comments, users)
exports.createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    // Target must exist
    const Model = TARGET_MODELS[targetType];
    const target = await Model.findById(targetId);
    if (!target) {
      return errorResponse(res, 404, `${targetType} not found`);
    }

    if (targetType === 'user' && target._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 400, 'You cannot report yourself');
    }

    // Duplicate guard: same reporter + same target with an unresolved report
    const duplicateQuery = {
      type: 'content-report',
      sender: req.user._id,
      resolved: false,
      title: { $regex: `^\\[${targetType}\\]` },
    };
    const relatedKey =
      targetType === 'idea' ? 'relatedIdea'
        : targetType === 'project' ? 'relatedProject'
          : targetType === 'comment' ? 'relatedComment'
            : 'relatedUser';
    duplicateQuery[relatedKey] = targetId;

    const existing = await Notification.findOne(duplicateQuery);
    if (existing) {
      return errorResponse(res, 400, 'You have already reported this content — it is awaiting review');
    }

    // Reports are reviewed in the admin panel; route them to an admin account
    const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });

    const label =
      targetType === 'user' ? target.name || 'a user'
        : targetType === 'comment' ? 'a comment'
          : `"${target.title || 'untitled'}"`;

    const notification = await Notification.create({
      recipient: admin ? admin._id : req.user._id,
      sender: req.user._id,
      type: 'content-report',
      title: `[${targetType}] Reported for ${reason}`,
      message: `${req.user.name} reported ${label} (${reason})${details ? `: "${details}"` : ''}`,
      [relatedKey]: target._id,
      relatedUser: targetType === 'user' ? target._id : undefined,
      actionUrl:
        targetType === 'idea' ? `/ideas/${targetId}`
          : targetType === 'project' ? `/projects/${targetId}`
            : targetType === 'user' ? `/users/${targetId}`
              : null,
    });

    successResponse(res, 201, 'Report submitted. Our moderators will review it.', notification);
  } catch (error) {
    next(error);
  }
};
