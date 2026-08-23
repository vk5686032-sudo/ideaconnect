const User = require('../models/User');
const Idea = require('../models/Idea');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Get dashboard stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalIdeas: await Idea.countDocuments(),
      totalProjects: await Project.countDocuments(),
      pendingMentorRequests: await User.countDocuments({ isMentorApproved: false, role: 'mentor' }),
      activeUsers: await User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    };

    successResponse(res, 200, 'Dashboard stats retrieved', stats);
  } catch (error) {
    next(error);
  }
};

// Get all users (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role;
    const search = req.query.search;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    paginatedResponse(res, 200, 'Users retrieved', users, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Update user role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    await logAdminAction(req.user._id, 'user-role-change', null, null, `Changed ${user.name || user.email} to ${role}`);
    successResponse(res, 200, 'User role updated', user);
  } catch (error) {
    next(error);
  }
};

// Approve mentor
exports.approveMentor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isMentorApproved: true, role: 'mentor' },
      { new: true }
    ).select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    await logAdminAction(req.user._id, 'mentor-approve', null, null, `Approved mentor: ${user.name || user.email}`);
    successResponse(res, 200, 'Mentor approved', user);
  } catch (error) {
    next(error);
  }
};

// Ban/Unban user
exports.toggleBanUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAdminAction(req.user._id, user.isActive ? 'user-unban' : 'user-ban', null, null, `${user.isActive ? 'Unbanned' : 'Banned'} user: ${user.name || user.email}`);
    successResponse(res, 200, user.isActive ? 'User unbanned' : 'User banned');
  } catch (error) {
    next(error);
  }
};

// Get all ideas (admin)
exports.getAllIdeas = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Idea.countDocuments(query);
    const ideas = await Idea.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    paginatedResponse(res, 200, 'Ideas retrieved', ideas, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Moderate idea
exports.moderateIdea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const idea = await Idea.findById(id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    if (action === 'archive') {
      idea.status = 'archived';
      await idea.save();
      await logAdminAction(req.user._id, 'idea-archive', idea._id, null, reason);
    } else if (action === 'delete') {
      await logAdminAction(req.user._id, 'idea-delete', idea._id, null, reason || idea.title);
      await idea.deleteOne();
    } else {
      return errorResponse(res, 400, 'Invalid action');
    }

    successResponse(res, 200, `Idea ${action}d`);
  } catch (error) {
    next(error);
  }
};

// Get all projects (admin)
exports.getAllProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    paginatedResponse(res, 200, 'Projects retrieved', projects, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Get analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const analytics = {
      userGrowth: await User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      ideasByCategory: await Idea.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      projectsByStatus: await Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      topUsers: await User.find().sort({ reputation: -1 }).limit(10).select('name reputation avatar'),
    };

    successResponse(res, 200, 'Analytics retrieved', analytics);
  } catch (error) {
    next(error);
  }
};

// ============ PROJECT MODERATION ============

// Moderate project (archive/delete)
exports.moderateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    if (action === 'archive') {
      project.status = 'cancelled';
      await project.save();
      await logAdminAction(req.user._id, 'project-archive', null, project._id, reason);
    } else if (action === 'delete') {
      await logAdminAction(req.user._id, 'project-delete', null, project._id, reason || project.title);
      await Task.deleteMany({ project: project._id });
      await project.deleteOne();
    } else {
      return errorResponse(res, 400, 'Invalid action');
    }

    successResponse(res, 200, `Project ${action}d`);
  } catch (error) {
    next(error);
  }
};

// ============ CONTENT REPORTS ============

// Get all reports
exports.getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;

    const query = { type: 'content-report' };
    if (status) query.resolved = status === 'resolved';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Notification.countDocuments(query);
    const reports = await Notification.find(query)
      .populate('sender', 'name email')
      .populate('relatedIdea', 'title')
      .populate('relatedProject', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    paginatedResponse(res, 200, 'Reports retrieved', reports, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Resolve a report (dismiss / take action)
exports.resolveReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;

    const report = await Notification.findById(id);
    if (!report) {
      return errorResponse(res, 404, 'Report not found');
    }

    // If admin chooses to take action on the reported content
    if (action === 'archive-idea' && report.relatedIdea) {
      await Idea.findByIdAndUpdate(report.relatedIdea, { status: 'archived' });
    } else if (action === 'delete-idea' && report.relatedIdea) {
      await Idea.findByIdAndDelete(report.relatedIdea);
    } else if (action === 'archive-project' && report.relatedProject) {
      await Project.findByIdAndUpdate(report.relatedProject, { status: 'cancelled' });
    } else if (action === 'delete-project' && report.relatedProject) {
      await Project.findByIdAndDelete(report.relatedProject);
    }

    report.set({
      read: true,
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: req.user._id,
      resolutionNote: note || action || 'Resolved',
    });
    await report.save();

    await logAdminAction(req.user._id, 'report-resolve', report.relatedIdea, report.relatedProject, `${action || 'resolved'}: ${note || ''}`.trim());

    successResponse(res, 200, 'Report resolved');
  } catch (error) {
    next(error);
  }
};

// ============ CONTENT APPROVAL WORKFLOW ============

// Get content pending approval (ideas/projects submitted for review)
exports.getPendingApprovals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const ideas = await Idea.find({ status: 'pending-approval' })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const projects = await Project.find({ status: 'pending-approval' })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    successResponse(res, 200, 'Pending approvals retrieved', { ideas, projects });
  } catch (error) {
    next(error);
  }
};

// Approve or reject an idea
exports.reviewIdeaApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approve, reason } = req.body;

    const idea = await Idea.findById(id);
    if (!idea) {
      return errorResponse(res, 404, 'Idea not found');
    }

    idea.status = approve ? 'open' : 'rejected';
    if (!approve) idea.rejectionReason = reason || 'Not approved by admin';
    await idea.save();

    // Notify the author
    await Notification.create({
      recipient: idea.author,
      type: 'system',
      title: approve ? 'Idea approved' : 'Idea rejected',
      message: approve
        ? `Your idea "${idea.title}" has been approved and published.`
        : `Your idea "${idea.title}" was not approved: ${reason || 'Not specified'}`,
      relatedIdea: idea._id,
      actionUrl: `/ideas/${idea._id}`,
    });

    await logAdminAction(req.user._id, approve ? 'idea-approve' : 'idea-reject', idea._id, null, reason);

    successResponse(res, 200, approve ? 'Idea approved' : 'Idea rejected', idea);
  } catch (error) {
    next(error);
  }
};

// Approve or reject a project
exports.reviewProjectApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approve, reason } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    project.status = approve ? 'planning' : 'rejected';
    if (!approve) project.rejectionReason = reason || 'Not approved by admin';
    await project.save();

    // Notify the owner
    await Notification.create({
      recipient: project.owner,
      type: 'system',
      title: approve ? 'Project approved' : 'Project rejected',
      message: approve
        ? `Your project "${project.title}" has been approved.`
        : `Your project "${project.title}" was not approved: ${reason || 'Not specified'}`,
      relatedProject: project._id,
      actionUrl: `/projects/${project._id}`,
    });

    await logAdminAction(req.user._id, approve ? 'project-approve' : 'project-reject', null, project._id, reason);

    successResponse(res, 200, approve ? 'Project approved' : 'Project rejected', project);
  } catch (error) {
    next(error);
  }
};

// ============ BULK ACTIONS ============

// Bulk ban/unban users
exports.bulkUserAction = async (req, res, next) => {
  try {
    const { ids, action } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 400, 'No user IDs provided');
    }

    let result;
    if (action === 'ban') {
      result = await User.updateMany({ _id: { $in: ids } }, { isActive: false });
    } else if (action === 'unban') {
      result = await User.updateMany({ _id: { $in: ids } }, { isActive: true });
    } else if (action === 'delete') {
      result = await User.deleteMany({ _id: { $in: ids } });
    } else if (action === 'make-mentor') {
      result = await User.updateMany({ _id: { $in: ids } }, { role: 'mentor', isMentorApproved: true });
    } else {
      return errorResponse(res, 400, 'Invalid action');
    }

    await logAdminAction(req.user._id, `bulk-${action}`, null, null, `Users: ${ids.join(', ')}`);

    successResponse(res, 200, `Bulk action completed (${result.modifiedCount || result.deletedCount || 0} affected)`, result);
  } catch (error) {
    next(error);
  }
};

// Bulk archive/delete ideas
exports.bulkIdeaAction = async (req, res, next) => {
  try {
    const { ids, action } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 400, 'No idea IDs provided');
    }

    let result;
    if (action === 'archive') {
      result = await Idea.updateMany({ _id: { $in: ids } }, { status: 'archived' });
    } else if (action === 'delete') {
      result = await Idea.deleteMany({ _id: { $in: ids } });
    } else {
      return errorResponse(res, 400, 'Invalid action');
    }

    await logAdminAction(req.user._id, `bulk-idea-${action}`, null, null, `Ideas: ${ids.join(', ')}`);

    successResponse(res, 200, `Bulk action completed (${result.modifiedCount || result.deletedCount || 0} affected)`, result);
  } catch (error) {
    next(error);
  }
};

// Bulk archive/delete projects
exports.bulkProjectAction = async (req, res, next) => {
  try {
    const { ids, action } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 400, 'No project IDs provided');
    }

    let result;
    if (action === 'archive') {
      result = await Project.updateMany({ _id: { $in: ids } }, { status: 'cancelled' });
    } else if (action === 'delete') {
      // Remove associated tasks too
      await Task.deleteMany({ project: { $in: ids } });
      result = await Project.deleteMany({ _id: { $in: ids } });
    } else {
      return errorResponse(res, 400, 'Invalid action');
    }

    await logAdminAction(req.user._id, `bulk-project-${action}`, null, null, `Projects: ${ids.join(', ')}`);

    successResponse(res, 200, `Bulk action completed (${result.modifiedCount || result.deletedCount || 0} affected)`, result);
  } catch (error) {
    next(error);
  }
};

// ============ AUDIT LOGS ============

// Get audit logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const adminId = req.query.adminId || req.query.admin;
    const action = req.query.action;
    const search = req.query.search;

    const query = {};
    if (adminId) query.admin = adminId;
    if (action) query.action = action;
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('admin', 'name email')
      .populate('relatedIdea', 'title')
      .populate('relatedProject', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    paginatedResponse(res, 200, 'Audit logs retrieved', logs, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// ============ HELPER: log admin action ============

async function logAdminAction(adminId, action, ideaId, projectId, details) {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      relatedIdea: ideaId,
      relatedProject: projectId,
      details,
    });
  } catch (e) {
    console.error('Failed to log admin action:', e.message);
  }
}
