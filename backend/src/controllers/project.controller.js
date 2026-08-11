const Project = require('../models/Project');
const Task = require('../models/Task');
const Invitation = require('../models/Invitation');
const Idea = require('../models/Idea');
const User = require('../models/User');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const notificationService = require('../services/notification.service');
const cloudinary = require('../config/cloudinary');

// Create project
exports.createProject = async (req, res, next) => {
  try {
    const { title, description, ideaId, technologies, deadline, visibility, tags } = req.body;

    const project = await Project.create({
      title,
      description,
      owner: req.user._id,
      idea: ideaId || null,
      technologies: technologies || [],
      deadline,
      visibility: visibility || 'public',
      tags: tags || [],
      members: [
        {
          user: req.user._id,
          role: 'lead',
          status: 'active',
        },
      ],
    });

    // Mark idea as converted if exists
    if (ideaId) {
      await Idea.findByIdAndUpdate(ideaId, {
        convertedToProject: project._id,
        status: 'in-progress',
      });
    }

    // Add to user's projects
    await User.findByIdAndUpdate(req.user._id, {
      $push: { projectsJoined: project._id },
    });

    await project.populate('owner', 'name avatar');

    successResponse(res, 201, 'Project created successfully', project);
  } catch (error) {
    next(error);
  }
};

// Get all projects
exports.getAllProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const technology = req.query.technology;
    const search = req.query.search;

    const query = { visibility: 'public' };

    if (status) query.status = status;
    if (technology) query.technologies = { $in: [new RegExp(technology, 'i')] };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { technologies: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    paginatedResponse(res, 200, 'Projects retrieved successfully', projects, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Get project by ID
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name avatar bio skills')
      .populate('members.user', 'name avatar skills')
      .populate('tasks')
      .populate('idea');

    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    successResponse(res, 200, 'Project retrieved successfully', project);
  } catch (error) {
    next(error);
  }
};

// Update project
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    // Check if user is owner or lead
    const member = project.members.find(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'lead'
    );

    if (!member && project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized to update this project');
    }

    const updateData = { ...req.body };
    delete updateData.owner;
    delete updateData.members;

    project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('owner members.user', 'name avatar');

    successResponse(res, 200, 'Project updated successfully', project);
  } catch (error) {
    next(error);
  }
};

// Delete project
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to delete this project');
    }

    // Delete tasks
    await Task.deleteMany({ project: project._id });

    // Remove from users' projectsJoined
    await User.updateMany(
      { projectsJoined: project._id },
      { $pull: { projectsJoined: project._id } }
    );

    await project.deleteOne();

    successResponse(res, 200, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Invite member
// Add a member directly to the project team (owner only)
exports.addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    // Only the owner can add members directly
    if (project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only the project owner can add members');
    }

    const isMember = project.members.some((m) => m.user.toString() === userId);
    if (isMember) {
      return errorResponse(res, 400, 'User is already a member');
    }

    project.members.push({
      user: userId,
      role: role || 'developer',
      joinedAt: new Date(),
      status: 'active',
    });
    await project.save();

    await project.populate('members.user', 'name avatar');
    await project.populate('owner', 'name avatar');

    successResponse(res, 200, 'Member added successfully', project);
  } catch (error) {
    next(error);
  }
};

// Remove a member from the project team (owner only; cannot remove the owner)
exports.removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }
    if (project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only the project owner can remove members');
    }
    if (userId === project.owner.toString()) {
      return errorResponse(res, 400, 'Cannot remove the project owner');
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== userId
    );
    await project.save();

    await project.populate('members.user', 'name avatar');
    await project.populate('owner', 'name avatar');

    successResponse(res, 200, 'Member removed successfully', project);
  } catch (error) {
    next(error);
  }
};

// Update a member's role (owner only)
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    const VALID_ROLES = ['lead', 'developer', 'designer', 'researcher', 'mentor'];
    if (!VALID_ROLES.includes(role)) {
      return errorResponse(res, 400, 'Invalid role');
    }

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }
    if (project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only the project owner can change roles');
    }
    if (userId === project.owner.toString()) {
      return errorResponse(res, 400, 'Cannot change the project owner role');
    }

    const member = project.members.find((m) => m.user.toString() === userId);
    if (!member) {
      return errorResponse(res, 400, 'User is not a member');
    }
    member.role = role;
    await project.save();

    await project.populate('members.user', 'name avatar');
    await project.populate('owner', 'name avatar');

    successResponse(res, 200, 'Role updated successfully', project);
  } catch (error) {
    next(error);
  }
};

exports.inviteMember = async (req, res, next) => {
  try {
    const { userId, role, message } = req.body;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    // Check if user is already a member
    const isMember = project.members.some((m) => m.user.toString() === userId);
    if (isMember) {
      return errorResponse(res, 400, 'User is already a member');
    }

    // Check for existing invitation
    const existingInvitation = await Invitation.findOne({
      recipient: userId,
      relatedProject: id,
      status: 'pending',
    });

    if (existingInvitation) {
      return errorResponse(res, 400, 'User already has a pending invitation');
    }

    const invitation = await Invitation.create({
      sender: req.user._id,
      recipient: userId,
      type: 'project-invite',
      relatedProject: id,
      role: role || 'developer',
      message,
    });

    // Send notification
    await notificationService.create({
      recipient: userId,
      sender: req.user._id,
      type: 'invitation',
      title: 'Project Invitation',
      message: `${req.user.name} invited you to join "${project.title}"`,
      relatedProject: project._id,
      actionUrl: `/projects/${project._id}`,
    });

    successResponse(res, 201, 'Invitation sent successfully', invitation);
  } catch (error) {
    next(error);
  }
};

// Accept/Reject invitation
exports.handleInvitation = async (req, res, next) => {
  try {
    const { invitationId, action } = req.params;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return errorResponse(res, 404, 'Invitation not found');
    }

    if (invitation.recipient.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized');
    }

    if (action === 'accept') {
      invitation.status = 'accepted';

      // Add to project members
      await Project.findByIdAndUpdate(invitation.relatedProject, {
        $push: {
          members: {
            user: req.user._id,
            role: invitation.role,
            status: 'active',
          },
        },
      });

      // Add to user's projects
      await User.findByIdAndUpdate(req.user._id, {
        $push: { projectsJoined: invitation.relatedProject },
      });
    } else {
      invitation.status = 'rejected';
    }

    await invitation.save();

    successResponse(res, 200, `Invitation ${action}ed successfully`);
  } catch (error) {
    next(error);
  }
};

// Update progress
exports.updateProgress = async (req, res, next) => {
  try {
    const { progress } = req.body;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    project.progress = progress;
    if (progress === 100) {
      project.status = 'completed';
    }
    await project.save();

    successResponse(res, 200, 'Progress updated successfully', { progress: project.progress });
  } catch (error) {
    next(error);
  }
};

// Get my projects
exports.getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id,
    })
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'My projects retrieved successfully', projects);
  } catch (error) {
    next(error);
  }
};
