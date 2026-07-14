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
      enum: ['WELCOME', 'PROFILE_INCOMPLETE', 'PENDING_ACTION', 'SUCCESSFUL_ACTION', 'INFO', 'LEAVE_APPLIED', 'LEAVE_STATUS', 'CORRECTION_APPLIED', 'CORRECTION_STATUS', 'ACCOUNT_VERIFIED', 'MAPPING_UPDATE'],
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
    },
    source: {
      type: String,
      enum: ['SCHOLAR_SYNC', 'SCHOLAR_TRACK'],
      default: 'SCHOLAR_SYNC'
    }
  },
  {
    timestamps: true
  }
);

// Query helpers for active recipient or active group scope
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ roleScope: 1, department: 1 });

// Pre-save hook to track if document is new
notificationSchema.pre('save', function() {
  this._isNewDoc = this.isNew;
});

// Post-save hook to dispatch email notification
notificationSchema.post('save', async function(doc) {
  if (doc._isNewDoc) {
    try {
      const { sendNotificationEmail } = require('../utils/emailService');
      sendNotificationEmail(doc).catch(err => {
        console.error('Error in sendNotificationEmail async call:', err);
      });
    } catch (err) {
      console.error('Error in notification post-save hook:', err);
    }
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
