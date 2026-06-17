const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null if it targets a whole group/roleScope
    },
    roleScope: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN'],
      default: null // null if it is direct to a specific recipient
    },
    department: {
      type: String,
      default: null // optional department scope (e.g. for HOD of a specific department)
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['WELCOME', 'PROFILE_INCOMPLETE', 'PENDING_ACTION', 'SUCCESSFUL_ACTION', 'INFO'],
      default: 'INFO'
    },
    isRead: {
      type: Boolean,
      default: false // used for personal notifications
    },
    isReadBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ], // used for role-scoped notifications to track who read them
    link: {
      type: String,
      default: '' // optional dashboard navigation tab link
    }
  },
  {
    timestamps: true
  }
);

// Query helpers for active recipient or active group scope
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ roleScope: 1, department: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
