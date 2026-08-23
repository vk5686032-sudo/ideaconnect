const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'user-ban',
        'user-unban',
        'user-delete',
        'user-make-mentor',
        'user-role-change',
        'mentor-approve',
        'idea-archive',
        'idea-delete',
        'idea-approve',
        'idea-reject',
        'bulk-ban',
        'bulk-unban',
        'bulk-delete',
        'bulk-make-mentor',
        'bulk-idea-archive',
        'bulk-idea-delete',
        'bulk-project-archive',
        'bulk-project-delete',
        'project-archive',
        'project-delete',
        'project-approve',
        'project-reject',
        'report-resolve',
      ],
    },
    relatedIdea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea',
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    details: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);