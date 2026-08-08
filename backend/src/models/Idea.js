const mongoose = require('mongoose');

// Mongoose 9 requires named sub-schemas for arrays of objects —
// inline `[{ ... }]` is no longer cast correctly.
const ideaImageSchema = new mongoose.Schema(
  {
    public_id: String,
    url: String,
  },
  { _id: false }
);

const ideaAttachmentSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    public_id: String,
  },
  { _id: false }
);

const mentorReviewSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    review: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ideaTeamSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: String,
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ideaSchema = new mongoose.Schema(
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
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'technology',
        'business',
        'healthcare',
        'education',
        'environment',
        'social',
        'entertainment',
        'finance',
        'other',
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'open', 'in-progress', 'completed', 'archived'],
      default: 'open',
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'invite-only'],
      default: 'public',
    },
    images: [ideaImageSchema],
    attachments: [ideaAttachmentSchema],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    feasibilityScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    innovationScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    aiAnalysis: {
      suggestions: [String],
      similarIdeas: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Idea',
        },
      ],
      challenges: [String],
      recommendedTechnologies: [String],
      analyzedAt: Date,
    },
    mentorReviews: [mentorReviewSchema],
    convertedToProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    team: [ideaTeamSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for search
ideaSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

// Virtual for comments
ideaSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'idea',
  justOne: false,
});

module.exports = mongoose.model('Idea', ideaSchema);
