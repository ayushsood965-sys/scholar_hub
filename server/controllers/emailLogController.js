const EmailQueue = require('../models/EmailQueue');
const User = require('../models/User');

/**
 * GET /api/email-logs
 * Fetches email delivery logs with optional date range filtering.
 * Query params: from, to, status, type, search, page, limit
 */
const getEmailLogs = async (req, res) => {
  try {
    const {
      from,
      to,
      status,
      type,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Date range filter
    if (from || to) {
      query.createdAt = {};
      if (from) {
        query.createdAt.$gte = new Date(from);
      }
      if (to) {
        // Set end of day for 'to' date
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    // Status filter
    if (status && ['PENDING', 'PROCESSING', 'SENT', 'FAILED'].includes(status)) {
      query.status = status;
    }

    // Type filter
    if (type && ['VERIFICATION', 'PASSWORD_RESET', 'NOTIFICATION'].includes(type)) {
      query.type = type;
    }

    // Search filter (searches across payload fields)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'payload.email': searchRegex },
        { 'payload.name': searchRegex },
        { 'payload.title': searchRegex },
        { 'payload.message': searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalItems = await EmailQueue.countDocuments(query);
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    const logs = await EmailQueue.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Enrich logs with recipient role from User collection
    const enrichedLogs = await Promise.all(logs.map(async (log) => {
      let recipientRole = null;
      let recipientName = null;
      const email = log.payload?.email;

      if (email) {
        const user = await User.findOne({ username: email }).select('role name').lean();
        if (user) {
          recipientRole = user.role;
          recipientName = user.name;
        }
      } else if (log.payload?.recipient) {
        // For notification emails that use recipient ObjectId
        const user = await User.findById(log.payload.recipient).select('role name username').lean();
        if (user) {
          recipientRole = user.role;
          recipientName = user.name;
          log.payload.email = user.username;
        }
      }

      return {
        ...log,
        recipientRole: recipientRole || 'UNKNOWN',
        recipientName: recipientName || log.payload?.name || 'Unknown'
      };
    }));

    res.json({
      logs: enrichedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/email-logs/stats
 * Returns summary statistics for the email queue.
 * Query params: from, to (optional date range)
 */
const getEmailStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};

    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = toDate;
      }
    }

    const [total, pending, processing, sent, failed] = await Promise.all([
      EmailQueue.countDocuments(dateFilter),
      EmailQueue.countDocuments({ ...dateFilter, status: 'PENDING' }),
      EmailQueue.countDocuments({ ...dateFilter, status: 'PROCESSING' }),
      EmailQueue.countDocuments({ ...dateFilter, status: 'SENT' }),
      EmailQueue.countDocuments({ ...dateFilter, status: 'FAILED' })
    ]);

    // Count by type
    const [verification, passwordReset, notification] = await Promise.all([
      EmailQueue.countDocuments({ ...dateFilter, type: 'VERIFICATION' }),
      EmailQueue.countDocuments({ ...dateFilter, type: 'PASSWORD_RESET' }),
      EmailQueue.countDocuments({ ...dateFilter, type: 'NOTIFICATION' })
    ]);

    // Average attempts for sent emails
    const avgAttemptsResult = await EmailQueue.aggregate([
      { $match: { ...dateFilter, status: 'SENT' } },
      { $group: { _id: null, avgAttempts: { $avg: '$attempts' } } }
    ]);
    const avgAttempts = avgAttemptsResult[0]?.avgAttempts || 0;

    res.json({
      total,
      pending,
      processing,
      sent,
      failed,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(1) : '0.0',
      byType: { verification, passwordReset, notification },
      avgAttempts: avgAttempts.toFixed(1)
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/email-logs/:id/retry
 * Resets a FAILED email job back to PENDING for re-processing.
 */
const retryFailedEmail = async (req, res) => {
  try {
    const job = await EmailQueue.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Email job not found.' });
    }

    if (job.status !== 'FAILED') {
      return res.status(400).json({ message: 'Only failed emails can be retried.' });
    }

    job.status = 'PENDING';
    job.attempts = 0;
    job.lastError = null;
    job.nextAttemptAt = new Date();
    await job.save();

    res.json({ success: true, message: 'Email re-queued for delivery.' });
  } catch (error) {
    console.error('Error retrying email:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEmailLogs, getEmailStats, retryFailedEmail };
