const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    idea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['lead', 'developer', 'designer', 'researcher', 'mentor'],
          default: 'developer',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['active', 'inactive', 'left'],
          default: 'active',
        },
      },
    ],
    status: {
      type: String,
      enum: ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled', 'pending-approval', 'rejected'],
      default: 'planning',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    repository: {
      type: String,
      trim: true,
    },
    demoUrl: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    milestones: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        dueDate: Date,
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
      },
    ],
    coverImage: {
      public_id: String,
      url: String,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for search
projectSchema.index({
  title: 'text',
  description: 'text',
  technologies: 'text',
});

// Hard invariant: a user can appear in members at most once. Controller
// guards can be bypassed by stale processes or future call sites — this
// makes duplicate member rows impossible to persist, full stop.
function dedupeMembers(members) {
  const seen = new Set();
  return (members || []).filter((m) => {
    if (!m || !m.user) return false;
    const key = String(m.user);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

projectSchema.pre('save', function () {
  if (this.isModified('members')) {
    this.members = dedupeMembers(this.members);
  }
});

projectSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() || {};
  const pushedMember = update.$push && update.$push.members;
  if (!pushedMember) return;

  const doc = await this.model.findOne(this.getQuery(), { members: 1 });
  if (!doc) return;

  const targetId = String(pushedMember.user ?? '');
  const alreadyMember = (doc.members || []).some(
    (m) => m.user && String(m.user) === targetId
  );

  if (alreadyMember) {
    const clone = { ...update };
    const restPush = { ...update.$push };
    delete restPush.members;
    delete clone.$push;
    if (Object.keys(restPush).length > 0) clone.$push = restPush;
    this.setUpdate(clone);
  }
});

module.exports = mongoose.model('Project', projectSchema);
