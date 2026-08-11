const Task = require('../models/Task');
const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/response');
const notificationService = require('../services/notification.service');

// Recalculate project progress based on completed tasks
const recalcProjectProgress = async (projectId) => {
  const total = await Task.countDocuments({ project: projectId });
  const completed = await Task.countDocuments({ project: projectId, status: 'completed' });

  let progress = 0;
  if (total > 0) {
    progress = Math.round((completed / total) * 100);
  }

  await Project.findByIdAndUpdate(projectId, { progress });
  return progress;
};

// Check membership
const isProjectMember = (project, userId) =>
  project.members.some((m) => m.user.toString() === userId.toString());

// Get all tasks for a project
exports.getProjectTasks = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort({ status: 1, order: 1, createdAt: -1 });

    successResponse(res, 200, 'Tasks retrieved successfully', tasks);
  } catch (error) {
    next(error);
  }
};

// Create task
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate, labels } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    // Only members can create tasks
    if (!isProjectMember(project, req.user._id) && project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only project members can create tasks');
    }

    const maxOrder = await Task.countDocuments({ project: project._id });

    // Respect the column the task was created in; fall back to 'todo'
    const VALID_STATUSES = ['todo', 'in-progress', 'review', 'completed', 'cancelled'];
    const taskStatus = VALID_STATUSES.includes(status) ? status : 'todo';

    const task = await Task.create({
      title,
      description,
      project: project._id,
      assignedTo: assignedTo || req.user._id,
      createdBy: req.user._id,
      priority: priority || 'medium',
      dueDate,
      labels: labels || [],
      status: taskStatus,
      order: maxOrder,
    });

    // Notify assignee
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      await notificationService.create({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'task-assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you a task: "${title}"`,
        relatedProject: project._id,
        actionUrl: `/projects/${project._id}`,
      });
    }

    await task.populate('assignedTo', 'name avatar');
    await task.populate('createdBy', 'name avatar');

    successResponse(res, 201, 'Task created successfully', task);
  } catch (error) {
    next(error);
  }
};

// Update task
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return errorResponse(res, 404, 'Task not found');
    }

    const project = await Project.findById(task.project);

    // Members can update tasks
    if (!isProjectMember(project, req.user._id) && project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized');
    }

    const updateData = { ...req.body };
    delete updateData.project;
    delete updateData.createdBy;

    // Track completion
    if (updateData.status === 'completed' && task.status !== 'completed') {
      updateData.completedAt = new Date();
    } else if (updateData.status && updateData.status !== 'completed') {
      updateData.completedAt = null;
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name avatar')
      .populate('createdBy', 'name avatar');

    await recalcProjectProgress(task.project);

    successResponse(res, 200, 'Task updated successfully', updatedTask);
  } catch (error) {
    next(error);
  }
};

// Reorder tasks / move between status columns (batch update)
exports.reorderTasks = async (req, res, next) => {
  try {
    const { projectId, tasks } = req.body;
    if (!projectId || !Array.isArray(tasks) || tasks.length === 0) {
      return errorResponse(res, 400, 'projectId and a non-empty tasks array are required');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    if (!isProjectMember(project, req.user._id) && project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized');
    }

    const ops = tasks
      .filter((t) => t && t._id)
      .map((t) => {
        const set = { order: typeof t.order === 'number' ? t.order : 0 };
        if (t.status) set.status = t.status;
        // Track completion timestamps when moved to/from 'completed'
        if (t.status === 'completed') set.completedAt = new Date();
        else set.completedAt = null;
        return {
          updateOne: {
            filter: { _id: t._id, project: projectId },
            update: { $set: set },
          },
        };
      });

    if (ops.length) {
      await Task.bulkWrite(ops);
    }

    await recalcProjectProgress(projectId);

    successResponse(res, 200, 'Tasks reordered successfully');
  } catch (error) {
    next(error);
  }
};

// Delete task
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return errorResponse(res, 404, 'Task not found');
    }

    const project = await Project.findById(task.project);
    if (!isProjectMember(project, req.user._id) && project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not authorized');
    }

    const projectId = task.project;
    await task.deleteOne();

    await recalcProjectProgress(projectId);

    successResponse(res, 200, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Get my assigned tasks
exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user._id,
      status: { $ne: 'completed' },
    })
      .populate('project', 'title status')
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    successResponse(res, 200, 'My tasks retrieved successfully', tasks);
  } catch (error) {
    next(error);
  }
};

// Add milestone
exports.addMilestone = async (req, res, next) => {
  try {
    const { title, description, dueDate } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only the project owner can add milestones');
    }

    project.milestones.push({
      title,
      description,
      dueDate,
      completed: false,
    });
    await project.save();

    successResponse(res, 201, 'Milestone added successfully', project.milestones);
  } catch (error) {
    next(error);
  }
};

// Update milestone (toggle complete / edit)
exports.updateMilestone = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only the project owner can update milestones');
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return errorResponse(res, 404, 'Milestone not found');
    }

    const { completed, title, description, dueDate } = req.body;

    if (typeof completed === 'boolean') {
      milestone.completed = completed;
      milestone.completedAt = completed ? new Date() : null;
    }
    if (title) milestone.title = title;
    if (description !== undefined) milestone.description = description;
    if (dueDate) milestone.dueDate = dueDate;

    await project.save();

    successResponse(res, 200, 'Milestone updated successfully', project.milestones);
  } catch (error) {
    next(error);
  }
};

// Delete milestone
exports.deleteMilestone = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only the project owner can delete milestones');
    }

    project.milestones.pull(req.params.milestoneId);
    await project.save();

    successResponse(res, 200, 'Milestone deleted successfully', project.milestones);
  } catch (error) {
    next(error);
  }
};