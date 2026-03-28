const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    // Multi-user: each project belongs to a Firebase UID
    owner_uid: {
      type: String,
      required: [true, 'Owner UID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: task count
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project_id',
  count: true,
});

module.exports = mongoose.model('Project', projectSchema);
