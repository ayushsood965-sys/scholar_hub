const EmailQueue = require('../models/EmailQueue');

/**
 * Email Queue — Public API
 * 
 * All email sending across the application MUST go through these functions.
 * Instead of sending emails synchronously (which blocks the HTTP request and
 * can trip Stalwart's rate limits under burst traffic), these functions
 * persist the email job to MongoDB and return immediately.
 * 
 * The background worker (emailWorker.js) picks up jobs and sends them
 * sequentially at a safe, throttled rate.
 */

// Priority levels — lower number = processed first
const PRIORITY = {
  VERIFICATION: 1,    // User is waiting on this to log in
  PASSWORD_RESET: 2,  // User is waiting on this to regain access
  NOTIFICATION: 10    // Informational, can wait
};

/**
 * Queue a verification email for a newly registered user.
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient display name
 * @param {string} token - Email verification token
 * @param {'sync'|'track'} portal - Which portal the user registered on
 * @returns {Promise<object>} The created queue document
 */
const queueVerificationEmail = async (email, name, token, portal) => {
  return EmailQueue.create({
    type: 'VERIFICATION',
    priority: PRIORITY.VERIFICATION,
    payload: { email, name, token, portal }
  });
};

/**
 * Queue a password reset email.
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient display name
 * @param {string} token - Password reset token
 * @param {'sync'|'track'} portal - Which portal the user requested from
 * @returns {Promise<object>} The created queue document
 */
const queuePasswordResetEmail = async (email, name, token, portal) => {
  return EmailQueue.create({
    type: 'PASSWORD_RESET',
    priority: PRIORITY.PASSWORD_RESET,
    payload: { email, name, token, portal }
  });
};

/**
 * Queue a notification email (single recipient or group broadcast).
 * @param {object} notification - The Notification document (or plain object with _id, recipient, roleScope, department, title, message, link, source)
 * @returns {Promise<object>} The created queue document
 */
const queueNotificationEmail = async (notification) => {
  return EmailQueue.create({
    type: 'NOTIFICATION',
    priority: PRIORITY.NOTIFICATION,
    payload: {
      notificationId: notification._id ? notification._id.toString() : null,
      recipient: notification.recipient ? notification.recipient.toString() : null,
      roleScope: notification.roleScope || null,
      department: notification.department || null,
      title: notification.title,
      message: notification.message,
      link: notification.link || '',
      source: notification.source || 'SCHOLAR_SYNC'
    }
  });
};

/**
 * Get queue statistics for monitoring/health checks.
 * @returns {Promise<object>} Counts by status
 */
const getQueueStats = async () => {
  const [pending, processing, sent, failed] = await Promise.all([
    EmailQueue.countDocuments({ status: 'PENDING' }),
    EmailQueue.countDocuments({ status: 'PROCESSING' }),
    EmailQueue.countDocuments({ status: 'SENT' }),
    EmailQueue.countDocuments({ status: 'FAILED' })
  ]);
  return { pending, processing, sent, failed, total: pending + processing + sent + failed };
};

module.exports = {
  queueVerificationEmail,
  queuePasswordResetEmail,
  queueNotificationEmail,
  getQueueStats,
  PRIORITY
};
