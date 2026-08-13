const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'like',
        'comment',
        'reply',
        'mention',
        'invitation',
        'join-request',
        'project-update',
        'task-assigned',
        'mentor-review',
        'ai-analysis',
        'system',
        'start-project-request',
        'start-project-approved',
        'start-project-rejected',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedIdea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea',
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    relatedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    relatedInvitation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invitation',
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    actionUrl: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
