const mongoose = require('mongoose');

const emailQueueSchema = new mongoose.Schema(
  {
    // Email type determines which sender function to use
    type: {
      type: String,
      enum: ['VERIFICATION', 'PASSWORD_RESET', 'NOTIFICATION'],
      required: true
    },
    // Payload stores all data needed to construct and send the email
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    // Processing state machine: PENDING → PROCESSING → SENT | FAILED
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'],
      default: 'PENDING'
    },
    // Priority: lower number = higher priority (verification > notification)
    priority: {
      type: Number,
      default: 10
    },
    // Retry tracking
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    // Next eligible processing time (used for exponential backoff)
    nextAttemptAt: {
      type: Date,
      default: Date.now
    },
    // Error tracking for diagnostics
    lastError: {
      type: String,
      default: null
    },
    // When the email was successfully sent
    sentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queue polling:
// Fetch PENDING jobs ordered by priority (asc) then creation time (asc),
// filtered by nextAttemptAt <= now
emailQueueSchema.index({ status: 1, nextAttemptAt: 1, priority: 1, createdAt: 1 });

// TTL index: auto-delete successfully sent emails after 7 days to prevent unbounded growth
emailQueueSchema.index({ sentAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60, partialFilterExpression: { status: 'SENT' } });

module.exports = mongoose.model('EmailQueue', emailQueueSchema);
