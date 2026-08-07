const User = require('../models/User');
const Idea = require('../models/Idea');
const Project = require('../models/Project');
const Report = require('../models/Notification');
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

    const query = {};
    if (status) query.status = status;

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
    } else if (action === 'delete') {
      await idea.deleteOne();
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

    const query = {};
    if (status) query.status = status;

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
